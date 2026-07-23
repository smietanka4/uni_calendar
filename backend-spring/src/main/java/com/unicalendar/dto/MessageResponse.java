package com.unicalendar.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

@Data
@AllArgsConstructor
public class MessageResponse {
    private String message;

    public static MessageResponse of(String message) {
        return new MessageResponse(message);
    }

    public static Map<String, String> error(String error) {
        return Map.of("error", error);
    }
}
