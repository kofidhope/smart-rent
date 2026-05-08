package com.kofi.notification.config;

import com.kofi.notification.event.BookingCancelledEvent;
import com.kofi.notification.event.BookingConfirmedEvent;
import com.kofi.notification.event.PaymentFailedEvent;
import com.kofi.notification.event.PaymentSucceededEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {

    // -------------------------------------------------------
    // Topics this service consumes from
    // notification-service is a pure consumer —
    // it never publishes to any topic
    // -------------------------------------------------------
    public static final String BOOKING_CONFIRMED_TOPIC  = "booking.confirmed";
    public static final String BOOKING_CANCELLED_TOPIC  = "booking.cancelled";
    public static final String PAYMENT_SUCCEEDED_TOPIC  = "payment.succeeded";
    public static final String PAYMENT_FAILED_TOPIC     = "payment.failed";

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    // -------------------------------------------------------
    // NO producer beans here
    // notification-service never publishes to Kafka
    // No KafkaTemplate, no ProducerFactory
    // The absence is intentional and documents the
    // pure-consumer nature of this service
    // -------------------------------------------------------

    // -------------------------------------------------------
    // Shared base consumer properties
    // All four listener factories use the same base config
    // Only the VALUE_DEFAULT_TYPE differs per factory
    // Extracted into a helper to avoid repetition
    // -------------------------------------------------------
    private Map<String, Object> baseConsumerProps() {
        Map<String, Object> props = new HashMap<>();

        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,bootstrapServers);

        props.put(ConsumerConfig.GROUP_ID_CONFIG, "notification-service-group");

        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);

        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);

        props.put(JsonDeserializer.TRUSTED_PACKAGES,
                "com.smartrent.notification.event," +
                        "com.smartrent.booking.event," +
                        "com.smartrent.payment.event");

        props.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);

        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

        props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 300000);

        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 10);

        return props;
    }

    // -------------------------------------------------------
    // Generic factory builder
    // Takes the target event class and returns a fully
    // configured listener container factory for that type.
    // All four listener factories call this method —
    // only the targetType parameter differs.
    // -------------------------------------------------------
    private <T> ConcurrentKafkaListenerContainerFactory<String, T>
    buildListenerFactory(Class<T> targetType) {

        Map<String, Object> props = baseConsumerProps();

        // Tell the deserializer which Java class to map
        // the JSON message body into for this factory
        props.put(JsonDeserializer.VALUE_DEFAULT_TYPE, targetType.getName());

        ConsumerFactory<String, T> consumerFactory = new DefaultKafkaConsumerFactory<>(props);

        ConcurrentKafkaListenerContainerFactory<String, T> factory = new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(consumerFactory);

        // AckMode.RECORD — commit offset after each
        // message is successfully processed
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.RECORD);

        // 3 concurrent consumer threads per listener
        // Matches the 3 partitions on each topic
        // Each thread owns one partition — maximum throughput
        factory.setConcurrency(3);

        // Attach error handler — retries twice then
        // logs the poison pill and moves on
        factory.setCommonErrorHandler(errorHandler());

        return factory;
    }

    // -------------------------------------------------------
    // LISTENER FACTORY — booking.confirmed topic
    // Consumed to send "Complete your payment" SMS
    // -------------------------------------------------------
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String,
            BookingConfirmedEvent> bookingConfirmedListenerFactory() {
        return buildListenerFactory(BookingConfirmedEvent.class);
    }

    // -------------------------------------------------------
    // LISTENER FACTORY — booking.cancelled topic
    // Consumed to send "Your booking was cancelled" SMS
    // -------------------------------------------------------
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String,
            BookingCancelledEvent> bookingCancelledListenerFactory() {
        return buildListenerFactory(BookingCancelledEvent.class);
    }

    // -------------------------------------------------------
    // LISTENER FACTORY — payment.succeeded topic
    // Consumed to send "Booking confirmed, payment received"
    // SMS to tenant AND "New booking" SMS to owner
    // -------------------------------------------------------
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String,
            PaymentSucceededEvent> paymentSucceededListenerFactory() {
        return buildListenerFactory(PaymentSucceededEvent.class);
    }

    // -------------------------------------------------------
    // LISTENER FACTORY — payment.failed topic
    // Consumed to send "Payment failed, booking cancelled" SMS
    // -------------------------------------------------------
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String,
            PaymentFailedEvent> paymentFailedListenerFactory() {
        return buildListenerFactory(PaymentFailedEvent.class);
    }

    // -------------------------------------------------------
    // Error handler — shared across all four factories
    // Retries failed messages twice with 2 second gap
    // After 2 retries logs at ERROR and moves on
    // Prevents one bad message blocking the partition
    // -------------------------------------------------------
    @Bean
    public DefaultErrorHandler errorHandler() {

        FixedBackOff backOff = new FixedBackOff(2000L, 2L);

        DefaultErrorHandler handler = new DefaultErrorHandler(
                (consumerRecord, exception) ->
                        log.error(
                                "Notification message failed after retries — " +
                                        "topic: {} partition: {} offset: {} " +
                                        "key: {} error: {}",
                                consumerRecord.topic(),
                                consumerRecord.partition(),
                                consumerRecord.offset(),
                                consumerRecord.key(),
                                exception.getMessage()
                        ),
                backOff
        );

        // Never retry deserialization failures —
        // the JSON is malformed and retrying reads
        // the same malformed bytes every time
        handler.addNotRetryableExceptions(
                org.springframework.kafka.support.serializer
                        .DeserializationException.class
        );

        return handler;
    }

    // Slf4j logger for error handler lambda
    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(KafkaConfig.class);
}
