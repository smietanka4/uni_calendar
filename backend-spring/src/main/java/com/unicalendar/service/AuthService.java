package com.unicalendar.service;

import com.unicalendar.config.JwtTokenProvider;
import com.unicalendar.dto.auth.*;
import com.unicalendar.exception.BadRequestException;
import com.unicalendar.model.User;
import com.unicalendar.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serwis autentykacji – odpowiednik Django auth_views.py.
 * Obsługuje rejestrację, logowanie, odświeżanie tokenu i reset hasła.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;



    /**
     * Rejestracja nowego użytkownika – odpowiednik Django RegisterView.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getPasswordConfirm())) {
            throw new BadRequestException("Hasła nie są identyczne.");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Nazwa użytkownika jest już zajęta.");
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()
                && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Ten adres e-mail jest już używany.");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);

        return buildAuthResponse(user);
    }

    /**
     * Logowanie – odpowiednik Django LoginView.
     */
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(), request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new BadRequestException("Nieprawidłowy login lub hasło.");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadRequestException("Nieprawidłowy login lub hasło."));

        return buildAuthResponse(user);
    }

    /**
     * Odświeżenie tokenu – odpowiednik Django TokenRefreshView.
     */
    public AuthResponse refresh(RefreshRequest request) {
        String refreshToken = request.getRefresh();

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Nieprawidłowy lub przeterminowany refresh token.");
        }

        String tokenType = jwtTokenProvider.getTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new BadRequestException("To nie jest refresh token.");
        }

        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("Użytkownik nie istnieje."));

        return buildAuthResponse(user);
    }

    /**
     * Tworzy AuthResponse z tokenami JWT.
     */
    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user);

        return AuthResponse.builder()
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .isStaff(user.isStaff())
                        .build())
                .access(accessToken)
                .refresh(newRefreshToken)
                .build();
    }
}
