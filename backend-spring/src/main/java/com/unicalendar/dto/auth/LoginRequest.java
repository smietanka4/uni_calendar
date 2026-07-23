package com.unicalendar.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Podaj login.")
    private String username;

    @NotBlank(message = "Podaj hasło.")
    private String password;
}
