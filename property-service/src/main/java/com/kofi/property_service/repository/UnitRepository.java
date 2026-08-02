package com.kofi.property_service.repository;

import com.kofi.property_service.model.PropertyStatus;
import com.kofi.property_service.model.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UnitRepository extends JpaRepository<Unit, UUID> {

    // All units for a property — ordered for display
    List<Unit> findByPropertyIdOrderByDisplayOrderAsc(UUID propertyId);

    // Available units only — for booking eligibility
    List<Unit> findByPropertyIdAndStatus(UUID propertyId, PropertyStatus status);

    // Count units per property
    long countByPropertyId(UUID propertyId);

    // Count available units — shown on property card
    // "3 of 5 units available"
    long countByPropertyIdAndStatus(UUID propertyId, PropertyStatus status);

    // Find the default unit — used for backwards
    // compatibility when booking-service sends
    // only propertyId with no unitId
    Optional<Unit> findFirstByPropertyIdOrderByDisplayOrderAsc(UUID propertyId);

    // Mark a unit as rented — called by booking saga
    @Modifying
    @Query("""
        UPDATE Unit u SET u.status = :status
        WHERE u.id = :unitId
        """)
    void updateStatus(@Param("unitId") UUID unitId, @Param("status") PropertyStatus status);
}
