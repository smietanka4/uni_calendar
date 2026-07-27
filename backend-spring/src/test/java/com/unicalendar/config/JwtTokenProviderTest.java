package com.unicalendar.config;

import com.unicalendar.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.security.core.userdetails.UserDetails;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private UserDetails user;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", "test-secret-key-minimum-32-characters-long-for-hmac");
        ReflectionTestUtils.setField(jwtTokenProvider, "accessExpirationMs", 3600000L);
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshExpirationMs", 604800000L);

        user = User.builder().username("testuser").password("pass").build();
    }

    @Test
    void testGenerateAccessToken() {
        String token = jwtTokenProvider.generateAccessToken(user);
        assertNotNull(token);
        assertEquals("testuser", jwtTokenProvider.getUsernameFromToken(token));
        assertEquals("access", jwtTokenProvider.getTokenType(token));
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    void testGenerateRefreshToken() {
        String token = jwtTokenProvider.generateRefreshToken(user);
        assertNotNull(token);
        assertEquals("testuser", jwtTokenProvider.getUsernameFromToken(token));
        assertEquals("refresh", jwtTokenProvider.getTokenType(token));
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    void testValidateToken_TamperedToken() {
        String token = jwtTokenProvider.generateAccessToken(user);
        String tamperedToken = token + "123";
        assertFalse(jwtTokenProvider.validateToken(tamperedToken));
    }

    @Test
    void testValidateToken_ExpiredToken() throws InterruptedException {
        // Set short expiration
        ReflectionTestUtils.setField(jwtTokenProvider, "accessExpirationMs", 1L);
        String token = jwtTokenProvider.generateAccessToken(user);
        
        // Wait for it to expire
        Thread.sleep(10);
        
        assertFalse(jwtTokenProvider.validateToken(token));
    }
}
