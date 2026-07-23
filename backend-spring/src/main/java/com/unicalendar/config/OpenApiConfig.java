package com.unicalendar.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Konfiguracja OpenAPI / Swagger – odpowiednik Django drf-spectacular SPECTACULAR_SETTINGS.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Uni Calendar API")
                        .description(
                            "API uczelnianego kalendarza zajęć. Pozwala zarządzać planami tygodniowymi, " +
                            "zajęciami, zapraszać użytkowników i resetować hasła."
                        )
                        .version("1.0.0")
                        .contact(new Contact().name("Zespół Uni Calendar"))
                        .license(new License().name("MIT"))
                )
                .addSecurityItem(new SecurityRequirement().addList("Bearer JWT"))
                .components(new Components()
                        .addSecuritySchemes("Bearer JWT",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Wpisz token JWT (bez prefiksu 'Bearer ')")
                        )
                );
    }
}
