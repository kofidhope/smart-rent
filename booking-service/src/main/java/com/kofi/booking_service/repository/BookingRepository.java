package com.kofi.booking_service.repository;

import com.kofi.booking_service.model.Booking;
import com.kofi.booking_service.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByTenantId(UUID tenantId);

    List<Booking> findByPropertyId(UUID propertyId);

    List<Booking> findByTenantIdAndBookingStatus(UUID tenantId, BookingStatus status);

    boolean existsByPropertyIdAndBookingStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            UUID propertyId,
            List<BookingStatus> statuses,
            LocalDate endDate,
            LocalDate startDate
    );
}
