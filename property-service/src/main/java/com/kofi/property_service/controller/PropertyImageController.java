package com.kofi.property_service.controller;

import com.kofi.property_service.dto.PropertyImageResponse;
import com.kofi.property_service.service.PropertyImageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/properties/{propertyId}/images")
@RequiredArgsConstructor
@Slf4j
public class PropertyImageController {

    private final PropertyImageService imageService;

    // ── Upload image
    // Only landlord who owns the property can upload
    // multipart/form-data with file field
    @PreAuthorize("hasRole('LANDLORD')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PropertyImageResponse> upload(
            @PathVariable UUID propertyId,
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") UUID ownerId) {

        log.info("Upload image — propertyId: {} " + "ownerId: {} file: {}",
                propertyId, ownerId,
                file.getOriginalFilename());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(imageService.uploadImage(propertyId, ownerId, file));
    }

    // ── Get all images
    // Public — anyone can view property images
    // Used by frontend image gallery
    @GetMapping
    public ResponseEntity<List<PropertyImageResponse>> getImages(@PathVariable UUID propertyId) {

        return ResponseEntity.ok(imageService.getPropertyImages(propertyId));
    }

    // ── Set primary image ─────────────────────────────────
    // Only landlord who owns the property
    @PreAuthorize("hasRole('LANDLORD')")
    @PatchMapping("/{imageId}/primary")
    public ResponseEntity<PropertyImageResponse> setPrimary(
            @PathVariable UUID propertyId,
            @PathVariable UUID imageId,
            @RequestHeader("X-User-Id") UUID ownerId) {

        return ResponseEntity.ok(imageService.setPrimaryImage(propertyId, imageId, ownerId));
    }

    // ── Delete image
    // Only landlord who owns the property
    @PreAuthorize("hasRole('LANDLORD')")
    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable UUID propertyId,
            @PathVariable UUID imageId,
            @RequestHeader("X-User-Id") UUID ownerId) {

        imageService.deleteImage(propertyId, imageId, ownerId);
        return ResponseEntity.noContent().build();
    }
}
