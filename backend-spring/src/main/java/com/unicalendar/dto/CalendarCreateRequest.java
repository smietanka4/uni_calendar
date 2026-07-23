package com.unicalendar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CalendarCreateRequest {

    @NotBlank(message = "Nazwa kalendarza jest wymagana.")
    @Size(max = 200)
    @JsonProperty("nazwa")
    private String name;

    @JsonProperty("haslo")
    private String password;
}
