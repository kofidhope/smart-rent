package com.kofi.userservice;

import com.kofi.userservice.model.Role;
import com.kofi.userservice.model.User;
import com.kofi.userservice.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients(basePackages = "com.kofi.userservice")
public class UserServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner seedUsers(UserRepository repo, PasswordEncoder encoder) {
        return args -> {
            // Seed Admin
            if (repo.findByEmail("admin@smartrent.com").isEmpty()) {
                User admin = User.builder()
                        .firstName("System")
                        .lastName("Admin")
                        .email("admin@smartrent.com")
                        .phone("233000000001") // unique phone required
                        .password(encoder.encode("AdminPass123"))
                        .role(Role.ADMIN)
                        .enabled(true)
                        .build();
                repo.save(admin);
            }

            // Seed Landlord
            if (repo.findByEmail("landlord@smartrent.com").isEmpty()) {
                User landlord = User.builder()
                        .firstName("Test")
                        .lastName("Landlord")
                        .email("landlord@smartrent.com")
                        .phone("233000000002") // unique phone required
                        .password(encoder.encode("LandlordPass123"))
                        .role(Role.LANDLORD)
                        .enabled(true)
                        .build();
                repo.save(landlord);
            }
        };
    }


}
