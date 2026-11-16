package com.unicalendar.dto;

import com.unicalendar.model.CalendarRole;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InviteKickRequest {

    @NotBlank(message = "Podaj nazwę użytkownika.")
    private String username;

    /** Opcjonalna rola – domyślnie COLLABORATOR (zapis) */
    private CalendarRole role = CalendarRole.COLLABORATOR;
}
