package com.unicalendar.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InviteKickRequest {

    @NotBlank(message = "Podaj nazwę użytkownika.")
    private String username;
}
