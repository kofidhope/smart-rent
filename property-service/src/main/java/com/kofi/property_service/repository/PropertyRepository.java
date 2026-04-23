package com.kofi.property_service.repository;

import com.kofi.property_service.model.Property;
import com.kofi.property_service.model.PropertyStatus;
import com.kofi.property_service.model.PropertyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID> {

    List<Property> findByOwnerIdAndStatus(UUID ownerId, PropertyStatus status);

    List<Property> findByStatus(PropertyStatus status);

    @Query("""
        SELECT p FROM Property p
        WHERE p.status = 'AVAILABLE'
        AND (:city IS NULL OR LOWER(p.city) = LOWER(:city))
        AND (:type IS NULL OR p.type = :type)
        AND (:minPrice IS NULL OR p.price >= :minPrice)
        AND (:maxPrice IS NULL OR p.price <= :maxPrice)
        AND (:minBedrooms IS NULL OR p.bedrooms >= :minBedrooms)
        """)
    List<Property> searchProperties(
            @Param("city") String city,
            @Param("type") PropertyType type,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minBedrooms") Integer minBedrooms
    );
}
