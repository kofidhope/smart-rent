package com.kofi.property_service.repository;

import com.kofi.property_service.model.Property;
import com.kofi.property_service.model.PropertyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    List<Property> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<Property> findByStatus(PropertyStatus status);

    Page<Property> findByStatus(PropertyStatus status, Pageable pageable);

    Page<Property> findAllByIdIn(List<UUID> ids, Pageable pageable);

    // Native query + explicit TEXT casts avoid PostgreSQL treating
    // unbound null filter params as bytea (lower(bytea) error).
    @Query(
            value = """
                SELECT * FROM properties p
                WHERE p.status = 'AVAILABLE'
                AND (CAST(:city AS TEXT) IS NULL OR LOWER(p.city) = LOWER(CAST(:city AS TEXT)))
                AND (CAST(:type AS TEXT) IS NULL OR p.type = CAST(:type AS TEXT))
                AND (CAST(:minPrice AS NUMERIC) IS NULL OR p.price >= CAST(:minPrice AS NUMERIC))
                AND (CAST(:maxPrice AS NUMERIC) IS NULL OR p.price <= CAST(:maxPrice AS NUMERIC))
                AND (CAST(:minBedrooms AS INTEGER) IS NULL OR p.bedrooms >= CAST(:minBedrooms AS INTEGER))
                ORDER BY p.created_at DESC
                """,
            countQuery = """
                SELECT COUNT(*) FROM properties p
                WHERE p.status = 'AVAILABLE'
                AND (CAST(:city AS TEXT) IS NULL OR LOWER(p.city) = LOWER(CAST(:city AS TEXT)))
                AND (CAST(:type AS TEXT) IS NULL OR p.type = CAST(:type AS TEXT))
                AND (CAST(:minPrice AS NUMERIC) IS NULL OR p.price >= CAST(:minPrice AS NUMERIC))
                AND (CAST(:maxPrice AS NUMERIC) IS NULL OR p.price <= CAST(:maxPrice AS NUMERIC))
                AND (CAST(:minBedrooms AS INTEGER) IS NULL OR p.bedrooms >= CAST(:minBedrooms AS INTEGER))
                """,
            nativeQuery = true
    )
    Page<Property> searchProperties(
            @Param("city") String city,
            @Param("type") String type,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minBedrooms") Integer minBedrooms,
            Pageable pageable
    );
}
