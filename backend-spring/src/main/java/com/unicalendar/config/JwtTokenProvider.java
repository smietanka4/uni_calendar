package com.unicalendar.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Generowanie i walidacja tokenów JWT.
 * Odpowiednik djangorestframework-simplejwt.
 */
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-expiration-ms}")
    private long accessExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    private SecretKey getSigningKey() {
        // Jeśli secret jest za krótki, uzupełnij go base64
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtSecret);
        } catch (Exception e) {
            // Fallback: użyj surowych bajtów stringa
            keyBytes = jwtSecret.getBytes();
        }
        // Upewnij się, że klucz ma minimum 256 bitów (32 bajty)
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generuje access token.
     */
    public String generateAccessToken(UserDetails userDetails) {
        return generateToken(userDetails, accessExpirationMs, "access");
    }

    /**
     * Generuje refresh token.
     */
    public String generateRefreshToken(UserDetails userDetails) {
        return generateToken(userDetails, refreshExpirationMs, "refresh");
    }

    private String generateToken(UserDetails userDetails, long expirationMs, String tokenType) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("token_type", tokenType);

        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Wyciąga username z tokenu.
     */
    public String getUsernameFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /**
     * Wyciąga typ tokenu (access/refresh).
     */
    public String getTokenType(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("token_type", String.class);
    }

    /**
     * Waliduje token.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
