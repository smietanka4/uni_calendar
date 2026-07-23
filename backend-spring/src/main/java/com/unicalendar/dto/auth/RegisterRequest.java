package com.unicalendar.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Nazwa użytkownika jest wymagana.")
    @Size(min = 3, max = 150, message = "Nazwa użytkownika musi mieć od 3 do 150 znaków.")
    private String username;

    @Email(message = "Podaj poprawny adres e-mail.")
    private String email;

    @NotBlank(message = "Hasło jest wymagane.")
    @Size(min = 8, message = "Hasło musi mieć co najmniej 8 znaków.")
    private String password;

    @NotBlank(message = "Potwierdzenie hasła jest wymagane.")
    private String passwordConfirm;
}
