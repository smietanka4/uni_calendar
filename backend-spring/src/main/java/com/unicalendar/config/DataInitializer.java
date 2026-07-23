package com.unicalendar.config;

import com.unicalendar.model.User;
import com.unicalendar.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Automatyczne tworzenie superusera przy starcie – odpowiednik Django entrypoint.sh.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.superuser.username}")
    private String superuserUsername;

    @Value("${app.superuser.email}")
    private String superuserEmail;

    @Value("${app.superuser.password}")
    private String superuserPassword;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername(superuserUsername)) {
            User admin = User.builder()
                    .username(superuserUsername)
                    .email(superuserEmail)
                    .password(passwordEncoder.encode(superuserPassword))
                    .staff(true)
                    .build();
            userRepository.save(admin);
            log.info("Superuser \"{}\" created.", superuserUsername);
        } else {
            log.info("Superuser \"{}\" already exists.", superuserUsername);
        }
    }
}
