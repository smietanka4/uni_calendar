package com.unicalendar.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordResetConfirmRequest {

    @NotBlank(message = "UID jest wymagany.")
    private String uid;

    @NotBlank(message = "Token jest wymagany.")
    private String token;

    @NotBlank(message = "Hasło jest wymagane.")
    @Size(min = 8, message = "Hasło musi mieć co najmniej 8 znaków.")
    private String password;

    @NotBlank(message = "Potwierdzenie hasła jest wymagane.")
    private String passwordConfirm;
}
