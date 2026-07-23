package com.unicalendar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.UUID;

@Data
public class JoinRequest {
    private UUID id;

    @JsonProperty("haslo")
    private String password;
}
