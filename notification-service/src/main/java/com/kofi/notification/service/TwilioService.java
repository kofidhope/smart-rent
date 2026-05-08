package com.kofi.notification.service;

import com.kofi.notification.config.TwilioConfig;
import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TwilioService {

    private final TwilioConfig twilioConfig;

    // SEND SMS
    // Sends a plain text SMS to any mobile number
    // Returns the Twilio message SID on success
    // Throws RuntimeException on failure — caller handles
    public String sendSms(String toPhoneNumber, String messageBody) {

        log.info("Sending SMS — to: {}", maskPhone(toPhoneNumber));

        validatePhone(toPhoneNumber);
        validateMessageBody(messageBody);
        try {
            Message message = buildSmsMessage(toPhoneNumber, messageBody);

            String sid = message.getSid();
            String status = message.getStatus().toString();

            log.info("SMS sent — sid: {} status: {} to: {}", sid, status, maskPhone(toPhoneNumber));

            return sid;

        } catch (ApiException e) {
            log.error("Twilio API error sending SMS — " + "to: {} code: {} message: {}",
                    maskPhone(toPhoneNumber),
                    e.getCode(),
                    e.getMessage());

            throw new RuntimeException("Twilio SMS failed [" + e.getCode() + "]: " + e.getMessage(), e);

        } catch (Exception e) {
            log.error("Unexpected error sending SMS — " + "to: {} error: {}",
                    maskPhone(toPhoneNumber),
                    e.getMessage());

            throw new RuntimeException("SMS send failed: " + e.getMessage(), e);
        }
    }

    // SEND WHATSAPP
    // Sends a WhatsApp message via Twilio WhatsApp API
    // toPhoneNumber must be E.164 format — +233xxxxxxxxx
    // Twilio prepends "whatsapp:" prefix internally
    // Returns Twilio message SID on success
    public String sendWhatsApp(String toPhoneNumber, String messageBody) {

        log.info("Sending WhatsApp — to: {} ", maskPhone(toPhoneNumber));

        validatePhone(toPhoneNumber);
        validateMessageBody(messageBody);

        // WhatsApp numbers require "whatsapp:" prefix
        String whatsappTo = toPhoneNumber.startsWith("whatsapp:") ? toPhoneNumber : "whatsapp:" + toPhoneNumber;

        try {
            Message message = Message.creator(new PhoneNumber(whatsappTo),
                    new PhoneNumber(twilioConfig.getWhatsappNumber()),
                    messageBody).create();

            String sid = message.getSid();

            log.info("WhatsApp sent — sid: {} to: {}", sid, maskPhone(toPhoneNumber));

            return sid;

        } catch (ApiException e) {
            log.error("Twilio API error sending WhatsApp — " + "to: {} code: {} message: {}",
                    maskPhone(toPhoneNumber),
                    e.getCode(),
                    e.getMessage());

            throw new RuntimeException("Twilio WhatsApp failed [" + e.getCode() + "]: " + e.getMessage(), e);

        } catch (Exception e) {
            log.error("Unexpected error sending WhatsApp — " + "to: {} error: {}",
                    maskPhone(toPhoneNumber),
                    e.getMessage());

            throw new RuntimeException("WhatsApp send failed: " + e.getMessage(), e);
        }
    }

    // VERIFY DELIVERY STATUS
    // Fetches current delivery status from Twilio
    // for a given message SID
    // Called by reconciliation job to update log records
    // from SENT to DELIVERED or UNDELIVERED
    public String getDeliveryStatus(String twilioSid) {

        log.info("Checking delivery status — sid: {}", twilioSid);

        try {
            Message message = Message.fetcher(twilioSid).fetch();

            String status = message.getStatus().toString();

            log.info("Delivery status — sid: {} status: {}", twilioSid, status);

            return status;

        } catch (ApiException e) {
            log.error("Could not fetch status for sid: {} " + "code: {} message: {}",
                    twilioSid, e.getCode(),
                    e.getMessage());

            throw new RuntimeException("Status fetch failed: " + e.getMessage(), e);
        }
    }

    // Private helpers

    // Build Message using Messaging Service if available
    // otherwise send directly from phone number
    private Message buildSmsMessage(String toPhoneNumber, String messageBody) {
        if (twilioConfig.hasMessagingService()) {
            // Messaging Service handles sender selection
            // Better deliverability, sticky sender per tenant
            return Message.creator(
                    new PhoneNumber(toPhoneNumber),
                    twilioConfig.getMessagingServiceSid(),
                    messageBody).create();
        } else {
            // Send directly from purchased phone number
            return Message.creator(
                    new PhoneNumber(toPhoneNumber),
                    new PhoneNumber(twilioConfig.getPhoneNumber()),
                    messageBody
            ).create();
        }
    }

    // Validate phone number before calling Twilio
    // Fails fast with clear error rather than letting
    // Twilio return a cryptic 400 error
    private void validatePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new RuntimeException("Phone number is null or empty");
        }
        if (!phone.startsWith("+")) {
            throw new RuntimeException("Phone number must be in E.164 format " + "(start with +): " + phone);
        }
        if (phone.length() < 10 ) {
            throw new RuntimeException("Phone number length invalid: " + phone);
        }
    }

    // Validate message body before calling Twilio
    private void validateMessageBody(String body) {
        if (body == null || body.isBlank()) {
            throw new RuntimeException("Message body cannot be empty");
        }
        // SMS segment limit — warn but do not fail
        // Twilio splits long messages automatically
        // but each segment is billed separately
        if (body.length() > 160) {
            log.warn("SMS body exceeds 160 chars " + "({} chars) — will be sent as " + "{} segments and billed accordingly",
                    body.length(),
                    (int) Math.ceil(body.length() / 160.0));
        }
    }

    // Mask phone number for safe logging
    // +233244123456 → +233*****456
    // Never log full phone numbers — personal data
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 6) {
            return "***";
        }
        String prefix = phone.substring(0, 4);
        String suffix = phone.substring(phone.length() - 3);
        return prefix + "*****" + suffix;
    }
}
