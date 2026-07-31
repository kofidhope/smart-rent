package com.kofi.booking_service.config;

import com.kofi.booking_service.model.Booking;
import com.kofi.booking_service.model.BookingStatus;
import com.kofi.booking_service.repository.BookingRepository;
import com.kofi.booking_service.saga.BookingSaga;
import com.kofi.booking_service.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingScheduler {

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final BookingSaga bookingSaga;

    @Scheduled(cron = "0 */30 * * * *")
    @Transactional
    public void autoCompleteExpiredBookings() {
        log.info("Running scheduled job to complete expired bookings...");

        List<Booking> expiredBookings = bookingRepository
                .findByBookingStatusAndEndDateBefore(BookingStatus.CONFIRMED, LocalDate.now());

        for (Booking booking : expiredBookings) {
            bookingService.completeBooking(booking.getId());
            bookingSaga.publishBookingCompleted(booking);
        }
    }
}

