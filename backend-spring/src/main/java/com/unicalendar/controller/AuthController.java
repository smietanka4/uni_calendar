package com.unicalendar.controller;

import com.unicalendar.dto.auth.*;
import com.unicalendar.dto.MessageResponse;
import com.unicalendar.service.AuthService;
import com.unicalendar.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Kontroler autentykacji – odpowiednik Django auth_views.py + urls.py auth/*.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "auth", description = "Rejestracja, logowanie, reset hasła")
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;

    @PostMapping("/register")
    @Operation(summary = "Rejestracja nowego użytkownika")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Logowanie – zwraca JWT access + refresh")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Odświeżenie access tokenu")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        AuthResponse response = authService.refresh(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/password-reset")
    @Operation(summary = "Żądanie resetu hasła – wysyła e-mail")
    public ResponseEntity<Map<String, String>> passwordReset(
            @Valid @RequestBody PasswordResetRequest request) {
        emailService.sendPasswordResetEmail(request.getEmail());
        return ResponseEntity.ok(Map.of(
                "message", "Jeśli konto z tym e-mailem istnieje, wysłaliśmy instrukcje resetowania hasła."
        ));
    }

    @PostMapping("/password-reset-confirm")
    @Operation(summary = "Potwierdzenie resetu hasła – ustawia nowe hasło")
    public ResponseEntity<?> passwordResetConfirm(
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        boolean success = emailService.confirmPasswordReset(
                request.getUid(), request.getToken(),
                request.getPassword(), request.getPasswordConfirm()
        );

        if (success) {
            return ResponseEntity.ok(Map.of(
                    "message", "Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować."
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Nieprawidłowy lub przeterminowany link resetujący."
            ));
        }
    }
}
