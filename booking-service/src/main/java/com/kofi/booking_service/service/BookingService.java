package com.kofi.booking_service.service;

import com.kofi.booking_service.client.PropertyServiceClient;
import com.kofi.booking_service.client.UserServiceClient;
import com.kofi.booking_service.dto.BookingRequest;
import com.kofi.booking_service.dto.BookingResponse;
import com.kofi.booking_service.dto.PropertyResponse;
import com.kofi.booking_service.dto.UserResponse;
import com.kofi.booking_service.exception.BookingNotFoundException;
import com.kofi.booking_service.exception.PropertyNotAvailableException;
import com.kofi.booking_service.exception.UnauthorizedAccessException;
import com.kofi.booking_service.model.Booking;
import com.kofi.booking_service.model.BookingStatus;
import com.kofi.booking_service.model.PaymentStatus;
import com.kofi.booking_service.repository.BookingRepository;
import com.kofi.booking_service.saga.BookingSaga;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PropertyServiceClient propertyServiceClient;
    private final UserServiceClient userServiceClient;
    private final BookingMapper mapper;
    private final BookingSaga bookingSaga;

    // CREATE — the most complex method in the service
    // Validates → calculates price → saves → starts saga
    @Transactional
    public BookingResponse createBooking(BookingRequest request, UUID tenantId) {

        log.info("Creating booking — tenantId: {} propertyId: {} " + "dates: {} to {}",
                tenantId, request.getPropertyId(),
                request.getStartDate(), request.getEndDate());

        // Validation 1: date logic
        validateDates(request.getStartDate(), request.getEndDate());

        // 1. Fetch property — validates it exists and is available
        PropertyResponse property = propertyServiceClient.getPropertyById(request.getPropertyId());

        if (property == null || !"AVAILABLE".equals(property.getStatus())) {
            throw new PropertyNotAvailableException("Property is not available for booking");
        }

        // 2: tenant is not the property owner
        if (property.getOwnerId().equals(tenantId)) {
            throw new PropertyNotAvailableException("You cannot book your own property");
        }

        // 3. Check date overlap with existing bookings
        boolean overlaps = bookingRepository
                .existsByPropertyIdAndBookingStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        request.getPropertyId(),
                        List.of(BookingStatus.PENDING,
                                BookingStatus.PAYMENT_INITIATED,
                                BookingStatus.CONFIRMED),
                        request.getEndDate(),
                        request.getStartDate()
                );

        if (overlaps) {
            throw new PropertyNotAvailableException(
                    "Property is already booked for these dates");
        }

        // 4.Price calculation
        long nights = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());

        if (nights < 1) {
            throw new PropertyNotAvailableException("Minimum booking is 1 night");
        }

        BigDecimal totalPrice = property.getPrice()
                .multiply(BigDecimal.valueOf(nights))
                .setScale(2, RoundingMode.HALF_UP);

        log.info("Price calculated — {} nights x {} = {}", nights, property.getPrice(), totalPrice);

        // 5. Fetch tenant for email
        UserResponse tenant = userServiceClient.getUserById(tenantId);

        // 6. Save booking in PENDING state
        Booking booking = Booking.builder()
                .tenantId(tenantId)
                .propertyId(request.getPropertyId())
                .ownerId(property.getOwnerId())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalPrice(totalPrice)
                .bookingStatus(BookingStatus.PENDING)
                .paymentStatus(PaymentStatus.UNPAID)
                .build();

        Booking saved = bookingRepository.save(booking);

        // 6. Start saga — publishes BookingConfirmedEvent to Kafka
        bookingSaga.initiatePayment(saved, tenant.getEmail(),
                property.getTitle());

        log.info("Booking created: {} for tenant: {} property: {}",
                saved.getId(), tenantId, request.getPropertyId());

        return mapper.toResponse(saved, property);
    }

    // READ — single booking
    // Only the tenant or the property owner can view it
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(UUID bookingId,UUID requesterId) {

        Booking booking = findOrThrow(bookingId);

        // Access control — only tenant or owner can view
        if (!booking.getTenantId().equals(requesterId) && !booking.getOwnerId().equals(requesterId)) {
            throw new UnauthorizedAccessException(
                    "You do not have access to this booking");
        }

        PropertyResponse property = propertyServiceClient.getPropertyById(booking.getPropertyId());
        return mapper.toResponse(booking, property);
    }

    // READ — all bookings for the logged-in tenant
    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(UUID tenantId) {

        log.info("Fetching bookings for tenantId: {}", tenantId);

        return bookingRepository
                .findByTenantId(tenantId)
                .stream()
                .map(booking -> {
                    PropertyResponse property = propertyServiceClient
                            .getPropertyById(booking.getPropertyId());
                    return mapper.toResponse(booking, property);
                })
                .toList();
    }

    // READ — all bookings for a property (owner view)
    // Only the property owner can call this
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByProperty(UUID propertyId,UUID requesterId) {

        PropertyResponse property = propertyServiceClient.getPropertyById(propertyId);

        if (property == null) {
            throw new BookingNotFoundException(
                    "Property not found: " + propertyId);
        }

        // Only the owner can see all bookings for their property
        if (!property.getOwnerId().equals(requesterId)) {
            throw new UnauthorizedAccessException(
                    "You do not own this property");
        }

        return bookingRepository
                .findByPropertyId(propertyId)
                .stream()
                .map(booking -> mapper.toResponse(booking, property))
                .toList();
    }

    // CANCEL — tenant cancels their own booking
    // Only cancellable if not yet CONFIRMED
    // Once CONFIRMED, a refund must be requested instead
    @Transactional
    public BookingResponse cancelBooking(UUID bookingId, UUID requesterId) {

        log.info("Cancel requested — bookingId: {} requesterId: {}", bookingId, requesterId);

        Booking booking = findOrThrow(bookingId);

        // Only the tenant who made the booking can cancel
        if (!booking.getTenantId().equals(requesterId)) {
            throw new UnauthorizedAccessException(
                    "You can only cancel your own bookings");
        }

        // Cannot cancel what is already cancelled or completed
        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new PropertyNotAvailableException(
                    "Booking is already cancelled");
        }

        if (booking.getBookingStatus() == BookingStatus.COMPLETED) {
            throw new PropertyNotAvailableException(
                    "Cannot cancel a completed booking");
        }

        // CONFIRMED bookings require a refund flow — not a simple cancel
        // The refund flow will be handled by payment-service
        if (booking.getBookingStatus() == BookingStatus.CONFIRMED) {
            throw new PropertyNotAvailableException(
                    "This booking is confirmed and payment has been taken. " +
                            "Please request a refund instead.");
        }

        // PENDING or PAYMENT_INITIATED — safe to cancel
        // Saga handles the transition and publishes cancellation event
        bookingSaga.onPaymentFailed(bookingId, "Cancelled by tenant");

        // Reload to get updated status after saga runs
        Booking updated = findOrThrow(bookingId);

        PropertyResponse property = propertyServiceClient
                .getPropertyById(booking.getPropertyId());

        log.info("Booking {} cancelled by tenant {}", bookingId, requesterId);

        return mapper.toResponse(updated, property);
    }

    // COMPLETE — marks a booking as completed after checkout
    // Called internally or by a scheduled job, not by the user
    @Transactional
    public void completeBooking(UUID bookingId) {

        Booking booking = findOrThrow(bookingId);

        if (booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            log.warn("Cannot complete booking {} — status is {}",
                    bookingId, booking.getBookingStatus());
            return;
        }

        if (booking.getEndDate().isAfter(LocalDate.now())) {
            log.warn("Cannot complete booking {} — end date {} is in future",
                    bookingId, booking.getEndDate());
            return;
        }

        booking.setBookingStatus(BookingStatus.COMPLETED);
        bookingRepository.save(booking);

        log.info("Booking {} marked as COMPLETED", bookingId);
    }

    // Private helpers
    private void validateDates(LocalDate startDate, LocalDate endDate) {

        if (startDate == null || endDate == null) {
            throw new PropertyNotAvailableException(
                    "Start date and end date are required");
        }

        if (!startDate.isBefore(endDate)) {
            throw new PropertyNotAvailableException(
                    "Start date must be before end date");
        }

        if (startDate.isBefore(LocalDate.now())) {
            throw new PropertyNotAvailableException(
                    "Start date cannot be in the past");
        }

        if (ChronoUnit.DAYS.between(startDate, endDate) > 365) {
            throw new PropertyNotAvailableException(
                    "Booking cannot exceed 365 nights");
        }
    }

    private Booking findOrThrow(UUID bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(
                        "Booking not found: " + bookingId));
    }
}