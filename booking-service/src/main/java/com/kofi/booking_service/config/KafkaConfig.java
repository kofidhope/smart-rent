package com.kofi.booking_service.config;

import com.kofi.booking_service.event.PaymentFailedEvent;
import com.kofi.booking_service.event.PaymentSucceededEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {

    // Topic name constants — used by publishers and listeners
    public static final String BOOKING_CONFIRMED_TOPIC = "booking.confirmed";
    public static final String BOOKING_CANCELLED_TOPIC = "booking.cancelled";
    public static final String PAYMENT_SUCCEEDED_TOPIC = "payment.succeeded";
    public static final String PAYMENT_FAILED_TOPIC    = "payment.failed";

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    // Topic declarations — Spring creates these on startup
    // if they don't already exist in Kafka

    @Bean
    public NewTopic bookingConfirmedTopic() {
        return TopicBuilder.name(BOOKING_CONFIRMED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic bookingCancelledTopic() {
        return TopicBuilder.name(BOOKING_CANCELLED_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    // Producer — sends BookingConfirmedEvent and
    // BookingCancelledEvent to Kafka
    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);

        // Do NOT add type headers — consumers in other service won't have the same package names
        props.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false);

        // Wait for all replicas to acknowledge before returning success
        props.put(ProducerConfig.ACKS_CONFIG, "all");

        // Retry up to 3 times on transient failures
        props.put(ProducerConfig.RETRIES_CONFIG, 3);
        props.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, 1000);

        // Prevent duplicate messages when retrying
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);

        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    // Consumer factories — one per inbound event type
    // Each has its own deserializer typed to the event class
    private <T> ConcurrentKafkaListenerContainerFactory<String, T>
    buildListenerFactory(Class<T> targetType) {

        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "booking-service-group");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);

        // Trust both our own event package and payment-service's package
        props.put(JsonDeserializer.TRUSTED_PACKAGES,
                "com.smartrent.booking.event,com.smartrent.payment.event");

        // Tell the deserializer exactly which class to map JSON into
        props.put(JsonDeserializer.VALUE_DEFAULT_TYPE, targetType.getName());

        // Do NOT read type info from headers — payment-service
        // publishes with different class paths
        props.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);

        // Commit offsets only after the listener method completes
        // successfully — prevents losing messages on crash
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

        ConsumerFactory<String, T> consumerFactory =
                new DefaultKafkaConsumerFactory<>(props);

        ConcurrentKafkaListenerContainerFactory<String, T> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);

        // Manual ack mode — offset committed only after
        // your @KafkaListener method returns without exception
        factory.getContainerProperties()
                .setAckMode(ContainerProperties.AckMode.RECORD);

        return factory;
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentSucceededEvent>
    paymentSucceededListenerFactory() {
        return buildListenerFactory(PaymentSucceededEvent.class);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentFailedEvent>
    paymentFailedListenerFactory() {
        return buildListenerFactory(PaymentFailedEvent.class);
    }
}

