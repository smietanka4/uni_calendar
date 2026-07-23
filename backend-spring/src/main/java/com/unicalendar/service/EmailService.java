package com.unicalendar.service;

import com.unicalendar.model.PasswordResetToken;
import com.unicalendar.model.User;
import com.unicalendar.repository.PasswordResetTokenRepository;
import com.unicalendar.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

/**
 * Serwis e-mail i resetu hasła.
 * Używa jednorazowego PasswordResetToken zamiast JWT dla bezpieczeństwa.
 */
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.default-from:no-reply@localhost.com}")
    private String defaultFrom;

    @Value("${spring.mail.host:}")
    private String mailHost;

    /**
     * Wysyła e-mail z linkiem do resetu hasła używając dedykowanego tokenu.
     */
    @Transactional
    public void sendPasswordResetEmail(String email) {
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            return; // Nie ujawniamy czy konto istnieje
        }

        User user = userOpt.get();
        String uid = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(String.valueOf(user.getId()).getBytes());

        // Usuń stare tokeny
        tokenRepository.deleteByUser(user);

        // Wygeneruj nowy
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(15)) // ważny 15 minut
                .build();
        resetToken = tokenRepository.save(resetToken);

        String tokenStr = resetToken.getId().toString();
        String resetLink = frontendUrl + "/reset-hasla/" + uid + "/" + tokenStr;

        if (mailHost != null && !mailHost.isBlank()) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(defaultFrom);
            message.setTo(user.getEmail());
            message.setSubject("[Uni Calendar] Reset Hasła");
            message.setText(
                "Cześć " + user.getUsername() + ",\n\n" +
                "Kliknij w poniższy link, aby zresetować hasło do swojego konta Uni Calendar:\n\n" +
                resetLink + "\n\n" +
                "Link jest ważny przez 15 minut.\n\n" +
                "Jeśli to nie Ty prosiłeś o reset, zignoruj tę wiadomość.\n\n" +
                "-- Uni Calendar"
            );
            mailSender.send(message);
        } else {
            // Console backend (dev)
            System.out.println("═══════════════════════════════════════════════════════");
            System.out.println("[EMAIL] Reset hasła dla: " + user.getEmail());
            System.out.println("Link: " + resetLink);
            System.out.println("═══════════════════════════════════════════════════════");
        }
    }

    /**
     * Potwierdza reset hasła – waliduje dedykowany token i ustawia nowe hasło.
     */
    @Transactional
    public boolean confirmPasswordReset(String uidEncoded, String tokenStr,
                                         String password, String passwordConfirm) {
        if (!password.equals(passwordConfirm)) {
            return false;
        }

        // Dekoduj UID
        Long userId;
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(uidEncoded));
            userId = Long.parseLong(decoded);
        } catch (Exception e) {
            return false;
        }

        // Parsuj UUID tokenu
        UUID tokenUuid;
        try {
            tokenUuid = UUID.fromString(tokenStr);
        } catch (Exception e) {
            return false;
        }

        Optional<PasswordResetToken> tokenOpt = tokenRepository.findById(tokenUuid);
        if (tokenOpt.isEmpty()) {
            return false;
        }

        PasswordResetToken resetToken = tokenOpt.get();

        // Sprawdź czy pasuje user
        if (!resetToken.getUser().getId().equals(userId)) {
            return false;
        }

        // Sprawdź czy nie wygasł
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken);
            return false;
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);

        // Usuń użyty token (One-time use)
        tokenRepository.delete(resetToken);

        return true;
    }
}
