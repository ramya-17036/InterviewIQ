package com.aiinterview.backend.controller;

import com.aiinterview.backend.entity.User;
import com.aiinterview.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database"));
    }

    @PutMapping("/company")
    public ResponseEntity<?> updateTargetCompany(@RequestBody Map<String, String> request) {
        try {
            String company = request.get("company");
            String role = request.get("role");
            User user = getAuthenticatedUser();
            user.setTargetCompany(company);
            if (role != null) {
                user.setTargetRole(role);
            }
            userService.save(user);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Target company and role updated successfully");
            response.put("targetCompany", company);
            response.put("targetRole", user.getTargetRole());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Error updating target company/role: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }
}
