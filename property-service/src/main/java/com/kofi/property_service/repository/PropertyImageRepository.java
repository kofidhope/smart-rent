package com.kofi.property_service.repository;


import com.kofi.property_service.model.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImage, UUID> {

    // All images for a property ordered by display order
    List<PropertyImage> findByPropertyIdOrderByDisplayOrderAsc(UUID propertyId);

    // Primary image for a property
    // Used in search results
    Optional<PropertyImage> findByPropertyIdAndIsPrimaryTrue(UUID propertyId);

    // Count images for a property
    // Enforce max image limit
    long countByPropertyId(UUID propertyId);

    // Unset all primary flags for a property
    // Called before setting a new primary
    @Modifying
    @Query("""
        UPDATE PropertyImage i
        SET i.isPrimary = false
        WHERE i.propertyId = :propertyId
        """)
    void unsetAllPrimary(@Param("propertyId") UUID propertyId);

    // Delete all images for a property
    // Called when property is deleted
    @Modifying
    @Query("""
        DELETE FROM PropertyImage i
        WHERE i.propertyId = :propertyId
        """)
    void deleteAllByPropertyId(@Param("propertyId") UUID propertyId);

    // Get all public IDs for a property
    // Used to bulk delete from Cloudinary
    @Query("""
        SELECT i.publicId FROM PropertyImage i
        WHERE i.propertyId = :propertyId
        """)
    List<String> findPublicIdsByPropertyId(@Param("propertyId") UUID propertyId);
}
