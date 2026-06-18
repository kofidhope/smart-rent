package com.kofi.property_service.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kofi.property_service.dto.PropertyImageResponse;
import com.kofi.property_service.exception.ResourceNotFoundException;
import com.kofi.property_service.exception.ConflictException;
import com.kofi.property_service.model.Property;
import com.kofi.property_service.model.PropertyImage;
import com.kofi.property_service.repository.PropertyImageRepository;
import com.kofi.property_service.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyImageService {

    private final PropertyImageRepository imageRepository;
    private final PropertyRepository propertyRepository;
    private final Cloudinary cloudinary;

    @Value("${cloudinary.folder}")
    private String cloudinaryFolder;

    // Max images per property
    private static final int MAX_IMAGES = 10;

    // -------------------------------------------------------
    // UPLOAD IMAGE
    // Validates file, uploads to Cloudinary,
    // saves metadata to DB
    // If it is the first image it becomes primary
    // automatically
    // -------------------------------------------------------
    @Transactional
    public PropertyImageResponse uploadImage(UUID propertyId, UUID ownerId, MultipartFile file) {

        // Verify property exists and belongs to owner
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + propertyId));

        if (!property.getOwnerId().equals(ownerId)) {
            throw new ConflictException("You do not own this property");
        }

        // Enforce max image limit
        long currentCount = imageRepository.countByPropertyId(propertyId);

        if (currentCount >= MAX_IMAGES) {
            throw new ConflictException("Maximum " + MAX_IMAGES +
                            " images allowed per property. " +
                            "Delete an image before uploading.");
        }

        // Validate file
        validateImageFile(file);

        // Upload to Cloudinary
        String publicId = cloudinaryFolder + "/" + propertyId + "/" + UUID.randomUUID();

        Map uploadResult = uploadToCloudinary(file, publicId);

        String imageUrl = (String) uploadResult.get("secure_url");
        String returnedPublicId = (String) uploadResult.get("public_id");

        // First image becomes primary automatically
        boolean isPrimary = currentCount == 0;

        // Display order is current count
        // so new image goes to the end
        PropertyImage image = PropertyImage.builder()
                .propertyId(propertyId)
                .imageUrl(imageUrl)
                .publicId(returnedPublicId)
                .isPrimary(isPrimary)
                .displayOrder((int) currentCount)
                .build();

        PropertyImage saved = imageRepository.save(image);

        log.info("Image uploaded — propertyId: {} " + "imageId: {} isPrimary: {}",
                propertyId, saved.getId(), isPrimary);

        return toResponse(saved);
    }

    // -------------------------------------------------------
    // GET ALL IMAGES FOR A PROPERTY
    // Returns ordered list — primary first
    // -------------------------------------------------------
    @Transactional(readOnly = true)
    public List<PropertyImageResponse> getPropertyImages(UUID propertyId) {

        // Verify property exists
        if (!propertyRepository.existsById(propertyId)) {
            throw new ResourceNotFoundException("Property not found: " + propertyId);
        }

        return imageRepository
                .findByPropertyIdOrderByDisplayOrderAsc(propertyId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // -------------------------------------------------------
    // SET PRIMARY IMAGE
    // Unsets all current primary flags then sets new one
    // Only property owner can do this
    // -------------------------------------------------------
    @Transactional
    public PropertyImageResponse setPrimaryImage(UUID propertyId, UUID imageId, UUID ownerId) {

        Property property = propertyRepository
                .findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + propertyId));

        if (!property.getOwnerId().equals(ownerId)) {
            throw new ConflictException("You do not own this property");
        }

        PropertyImage image = imageRepository
                .findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found: " + imageId));

        if (!image.getPropertyId().equals(propertyId)) {
            throw new ConflictException("Image does not belong " + "to this property");
        }

        // Unset all primary flags for this property
        imageRepository.unsetAllPrimary(propertyId);

        // Set new primary
        image.setIsPrimary(true);
        PropertyImage updated = imageRepository.save(image);

        log.info("Primary image set — propertyId: {} " + "imageId: {}", propertyId, imageId);

        return toResponse(updated);
    }

    // -------------------------------------------------------
    // DELETE IMAGE
    // Removes from Cloudinary and DB
    // If deleted image was primary, next image
    // becomes primary automatically
    // -------------------------------------------------------
    @Transactional
    public void deleteImage(UUID propertyId, UUID imageId, UUID ownerId) {

        Property property = propertyRepository
                .findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + propertyId));

        if (!property.getOwnerId().equals(ownerId)) {
            throw new ConflictException("You do not own this property");
        }

        PropertyImage image = imageRepository
                .findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found: " + imageId));

        if (!image.getPropertyId().equals(propertyId)) {
            throw new ConflictException("Image does not belong " + "to this property");
        }

        boolean wasPrimary = image.getIsPrimary();

        // Delete from Cloudinary first
        deleteFromCloudinary(image.getPublicId());

        // Delete from DB
        imageRepository.delete(image);

        // If deleted image was primary, make
        // the next available image primary
        if (wasPrimary) {
            List<PropertyImage> remaining = imageRepository.findByPropertyIdOrderByDisplayOrderAsc(propertyId);

            if (!remaining.isEmpty()) {
                PropertyImage newPrimary = remaining.get(0);
                newPrimary.setIsPrimary(true);
                imageRepository.save(newPrimary);

                log.info("New primary set after delete " + "— imageId: {}", newPrimary.getId());
            }
        }

        log.info("Image deleted — propertyId: {} " + "imageId: {}", propertyId, imageId);
    }

    // -------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------

    private void validateImageFile(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new ConflictException("File cannot be empty");
        }

        // Max 5MB
        long maxSize = 5L * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new ConflictException("File size cannot exceed 5MB. " + "Current size: " +
                            (file.getSize() / 1024 / 1024)
                            + "MB");
        }

        String contentType = file.getContentType();
        if (contentType == null
                || (!contentType.equals("image/jpeg")
                && !contentType.equals("image/png")
                && !contentType.equals("image/webp"))) {
            throw new ConflictException(
                    "Only JPG, PNG And WebP "  + "images are allowed");
        }
    }

    private Map uploadToCloudinary(MultipartFile file, String publicId) {
        try {
            return cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "public_id", publicId,
                            "resource_type", "image",
                            // Auto quality and format
                            "quality", "auto",
                            "fetch_format", "auto",
                            // Resize to max 1200px wide
                            // preserving aspect ratio
                            "transformation",
                            ObjectUtils.asMap(
                                    "width", 1200, "crop", "limit"
                            )
                    )
            );
        } catch (IOException e) {
            log.error("Cloudinary upload failed: {}", e.getMessage());
            throw new RuntimeException("Image upload failed: " + e.getMessage());
        }
    }

    private void deleteFromCloudinary(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Cloudinary image deleted: {}", publicId);
        } catch (IOException e) {
            // Log but do not fail — DB record
            // should still be deleted
            log.error("Cloudinary delete failed " + "for {}: {}", publicId, e.getMessage());
        }
    }

    private PropertyImageResponse toResponse(PropertyImage image) {
        return PropertyImageResponse.builder()
                .id(image.getId())
                .propertyId(image.getPropertyId())
                .imageUrl(image.getImageUrl())
                .isPrimary(image.getIsPrimary())
                .displayOrder(image.getDisplayOrder())
                .createdAt(image.getCreatedAt())
                .build();
    }
}
