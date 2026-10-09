package com.aiinterview.backend.controller;

import com.aiinterview.backend.dto.AuthResponse;
import com.aiinterview.backend.dto.LoginRequest;
import com.aiinterview.backend.dto.RegisterRequest;
import com.aiinterview.backend.entity.User;
import com.aiinterview.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            User user = userService.registerUser(registerRequest);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("username", user.getUsername());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            String token = userService.loginUser(loginRequest);
            User user = userService.findByUsername(loginRequest.getUsername()).orElseThrow();
            return ResponseEntity.ok(new AuthResponse(
                    token,
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole(),
                    user.getTargetCompany(),
                    user.getTargetRole()
            ));
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid username or password");
            return ResponseEntity.status(401).body(errorResponse);
        }
    }
}
