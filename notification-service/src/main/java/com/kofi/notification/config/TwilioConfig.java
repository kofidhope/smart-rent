package com.kofi.notification.config;

import com.twilio.Twilio;
import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

@Configuration
@ConfigurationProperties(prefix = "twilio")
@Validated
@Data
@Slf4j
public class TwilioConfig {

    // Your Twilio Account SID — format: ACxxxxxxxxxxxxxxxx
    // Found on console.twilio.com dashboard
    @NotBlank(message = "Twilio account SID must be configured")
    private String accountSid;

    // Your Twilio Auth Token — 32 character string
    // Treat like a password — never log, never commit
    @NotBlank(message = "Twilio auth token must be configured")
    private String authToken;

    // The Twilio phone number you purchased
    // Format: +12025551234 (E.164 format)
    // Used as the From number on every SMS
    @NotBlank(message = "Twilio phone number must be configured")
    private String phoneNumber;

    // Twilio WhatsApp sandbox number for testing
    // Format: whatsapp:+14155238886
    // For production use your approved WhatsApp Business number
    @NotBlank(message = "Twilio WhatsApp number must be configured")
    private String whatsappNumber;

    // Optional — Twilio Messaging Service SID
    // Format: MGxxxxxxxxxxxxxxxx
    // Enables smart routing across multiple numbers
    // If blank, phoneNumber is used directly as From
    private String messagingServiceSid;

    // -------------------------------------------------------
    // Initialize Twilio SDK on startup
    //
    // Twilio.init() is a static initializer — it sets
    // the global credentials used by all Twilio SDK calls.
    // Must be called once before any Message.creator() call.
    //
    // @PostConstruct runs after Spring injects all fields
    // from ConfigurationProperties — guaranteed to have
    // real values before init() is called.
    // -------------------------------------------------------
    @PostConstruct
    public void initTwilio() {
        log.info("Initializing Twilio SDK — " +
                        "accountSid: {}*** phoneNumber: {}",
                accountSid.substring(0, 6),
                phoneNumber);

        Twilio.init(accountSid, authToken);

        log.info("Twilio SDK initialized successfully");
    }

    // -------------------------------------------------------
    // Whether to use Messaging Service or direct number
    // Messaging Service is preferred when available —
    // better deliverability, sticky sender, load balancing
    // -------------------------------------------------------
    public boolean hasMessagingService() {
        return messagingServiceSid != null
                && !messagingServiceSid.isBlank();
    }

    // -------------------------------------------------------
    // Safe logging — never log the full account SID
    // Shows first 6 chars: AC1234*** enough to verify
    // which account without exposing the full identifier
    // -------------------------------------------------------
    public String getMaskedAccountSid() {
        if (accountSid == null || accountSid.length() < 6) {
            return "***";
        }
        return accountSid.substring(0, 6) + "***";
    }

    // -------------------------------------------------------
    // Auth token must NEVER appear in logs
    // This method exists to make it impossible to
    // accidentally log the token — always returns masked
    // -------------------------------------------------------
    public String getMaskedAuthToken() {
        return "***hidden***";
    }
}
