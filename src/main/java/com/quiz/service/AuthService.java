package com.quiz.service;

import com.quiz.dto.AuthRequest;
import com.quiz.dto.AuthResponse;
import com.quiz.model.User;
import com.quiz.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public AuthResponse register(AuthRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return new AuthResponse(false, "Username already exists. Please choose another.");
        }
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            return new AuthResponse(false, "Username is required.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 4) {
            return new AuthResponse(false, "Password must be at least 4 characters.");
        }
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            return new AuthResponse(false, "Full name is required.");
        }

        User.Role role;
        try {
            role = User.Role.valueOf(request.getRole().toUpperCase());
        } catch (Exception e) {
            return new AuthResponse(false, "Role must be TEACHER or STUDENT.");
        }

        User user = new User(request.getUsername(), request.getPassword(), request.getFullName(), role);
        User saved = userRepository.save(user);
        return new AuthResponse(saved.getId(), saved.getUsername(), saved.getFullName(), saved.getRole().name());
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElse(null);
        if (user == null || !user.getPassword().equals(request.getPassword())) {
            return new AuthResponse(false, "Invalid username or password.");
        }
        AuthResponse response = new AuthResponse(user.getId(), user.getUsername(), user.getFullName(), user.getRole().name());
        response.setMessage("Login successful");
        return response;
    }
}
