package com.kofi.paymentservice.config;

import com.kofi.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class SchedulerConfig {

    private final PaymentService paymentService;

    // Runs every 30 minutes
    // fixedDelay means 30 minutes after the previous
    // run completes — prevents overlapping executions
    @Scheduled(fixedDelay = 1800000)
    public void reconcileStuckPayments() {
        log.info("Scheduled reconciliation starting");
        paymentService.reconcileStuckPayments();
        log.info("Scheduled reconciliation complete");
    }
}
