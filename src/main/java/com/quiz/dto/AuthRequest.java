package com.quiz.dto;

public class AuthRequest {
    private String username;
    private String password;
    private String fullName; // used only for register
    private String role;     // "TEACHER" or "STUDENT", used only for register

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
