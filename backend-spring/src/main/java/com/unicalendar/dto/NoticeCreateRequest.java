package com.unicalendar.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NoticeCreateRequest {
    @NotBlank(message = "Treść ogłoszenia nie może być pusta.")
    private String content;
}
