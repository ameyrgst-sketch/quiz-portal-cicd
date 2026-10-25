package com.quiz.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "<h1>Online Quiz Portal is Live!</h1><p>CI/CD Pipeline successfully deployed using Jenkins & Docker on Port 8090.</p>";
    }
}