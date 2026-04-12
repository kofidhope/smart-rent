package com.kofi.userservice.service;

import com.kofi.userservice.dto.RegistrationRequest;
import com.kofi.userservice.dto.UserResponse;
import com.kofi.userservice.model.Role;
import com.kofi.userservice.model.User;
import com.kofi.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public UserResponse register(RegistrationRequest request) {
        //check if email exist
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email Already Exists");
        }
        //check if phone number exist
        if (userRepository.existsByPhone(request.getPhoneNumber())) {
            throw new RuntimeException("Phone Number Already In Use");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhoneNumber())
                .role(Role.TENANT)
                .enabled(true)
                .build();
        User saved = userRepository.save(user);
        return mapToResponse(saved);
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponse(user);
    }

    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponse(user);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhone())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
