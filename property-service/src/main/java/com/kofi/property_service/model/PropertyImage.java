package com.kofi.property_service.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "property_images")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Which property this image belongs to
    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    // Cloudinary delivery URL
    // Use this in frontend img src
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    // Cloudinary public ID — needed to delete the image
    // Format: smartrent/property-images/uuid/timestamp
    @Column(name = "public_id", nullable = false)
    private String publicId;

    // The main image shown in search results
    // Only one per property
    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;

    // Controls display order in image gallery
    // Lower number = shown first
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
