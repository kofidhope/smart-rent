package com.kofi.paymentservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class WebClientConfig {

    private final PaystackConfig paystackConfig;

    @Bean
    public WebClient paystackWebClient() {
        return WebClient.builder()
                .baseUrl(paystackConfig.getBaseUrl())
                .defaultHeader(
                        HttpHeaders.AUTHORIZATION,
                        paystackConfig.getBearerToken()
                )
                .defaultHeader(
                        HttpHeaders.CONTENT_TYPE,
                        MediaType.APPLICATION_JSON_VALUE
                )
                .defaultHeader(
                        HttpHeaders.ACCEPT,
                        MediaType.APPLICATION_JSON_VALUE
                )
                .filter(requestLoggingFilter())
                .filter(responseLoggingFilter())
                .filter(errorHandlingFilter())
                .build();
    }

    // -------------------------------------------------------
    // Logs every outgoing request to Paystack API
    // Shows method, URL, and masked auth header
    // Helps debug 400/422 errors from Paystack
    // -------------------------------------------------------
    private ExchangeFilterFunction requestLoggingFilter() {
        return ExchangeFilterFunction.ofRequestProcessor(request -> {
            log.debug("Paystack API request → {} {} | key: {}",
                    request.method(),
                    request.url(),
                    paystackConfig.getMaskedSecretKey());
            return Mono.just(request);
        });
    }

    // -------------------------------------------------------
    // Logs every response received from Paystack API
    // Shows HTTP status code — body logged separately
    // in PaystackService after deserialization
    // -------------------------------------------------------
    private ExchangeFilterFunction responseLoggingFilter() {
        return ExchangeFilterFunction.ofResponseProcessor(response -> {
            log.debug("Paystack API response ← status: {}",
                    response.statusCode());
            return Mono.just(response);
        });
    }

    // -------------------------------------------------------
    // Handles non-2xx responses from Paystack API
    // Converts them to descriptive RuntimeExceptions
    // so PaymentService catches a meaningful error
    // instead of a generic WebClientResponseException
    // -------------------------------------------------------
    private ExchangeFilterFunction errorHandlingFilter() {
        return ExchangeFilterFunction.ofResponseProcessor(response -> {
            if (response.statusCode().is4xxClientError()) {
                return response.bodyToMono(String.class)
                        .flatMap(body -> {
                            log.error(
                                    "Paystack API 4xx error — status: {} body: {}",
                                    response.statusCode(), body);
                            return Mono.error(new RuntimeException(
                                    "Paystack client error " +
                                            response.statusCode() +
                                            ": " + body));
                        });
            }
            if (response.statusCode().is5xxServerError()) {
                return response.bodyToMono(String.class)
                        .flatMap(body -> {
                            log.error(
                                    "Paystack API 5xx error — status: {} body: {}",
                                    response.statusCode(), body);
                            return Mono.error(new RuntimeException(
                                    "Paystack server error " +
                                            response.statusCode() +
                                            ": " + body));
                        });
            }
            return Mono.just(response);
        });
    }
}
