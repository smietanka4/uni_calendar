package com.unicalendar.service;

import com.unicalendar.dto.auth.AuthResponse;
import com.unicalendar.dto.auth.LoginRequest;
import com.unicalendar.dto.auth.RegisterRequest;
import com.unicalendar.exception.BadRequestException;
import com.unicalendar.model.User;
import com.unicalendar.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @MockBean
    private RedisConnectionFactory redisConnectionFactory; // Disable real Redis in tests

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void testRegister_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("newuser@example.com");
        request.setPassword("password123");
        request.setPasswordConfirm("password123");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertNotNull(response.getAccess());
        assertNotNull(response.getRefresh());
        assertEquals("newuser", response.getUser().getUsername());
        assertTrue(userRepository.existsByUsername("newuser"));
    }

    @Test
    void testRegister_PasswordsMismatch() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("user1");
        request.setPassword("pass1");
        request.setPasswordConfirm("pass2");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(request));
        assertEquals("Hasła nie są identyczne.", ex.getMessage());
    }

    @Test
    void testRegister_DuplicateUsername() {
        RegisterRequest initialRequest = new RegisterRequest();
        initialRequest.setUsername("dupuser");
        initialRequest.setPassword("pass");
        initialRequest.setPasswordConfirm("pass");
        authService.register(initialRequest);

        RegisterRequest request = new RegisterRequest();
        request.setUsername("dupuser");
        request.setPassword("pass");
        request.setPasswordConfirm("pass");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(request));
        assertEquals("Nazwa użytkownika jest już zajęta.", ex.getMessage());
    }

    @Test
    void testRegister_DuplicateEmail() {
        RegisterRequest initialRequest = new RegisterRequest();
        initialRequest.setUsername("userA");
        initialRequest.setEmail("dup@example.com");
        initialRequest.setPassword("pass");
        initialRequest.setPasswordConfirm("pass");
        authService.register(initialRequest);

        RegisterRequest request = new RegisterRequest();
        request.setUsername("userB");
        request.setEmail("dup@example.com");
        request.setPassword("pass");
        request.setPasswordConfirm("pass");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(request));
        assertEquals("Ten adres e-mail jest już używany.", ex.getMessage());
    }

    @Test
    void testLogin_Success() {
        RegisterRequest regReq = new RegisterRequest();
        regReq.setUsername("loginuser");
        regReq.setPassword("secret");
        regReq.setPasswordConfirm("secret");
        authService.register(regReq);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setUsername("loginuser");
        loginReq.setPassword("secret");

        AuthResponse response = authService.login(loginReq);
        assertNotNull(response);
        assertNotNull(response.getAccess());
        assertEquals("loginuser", response.getUser().getUsername());
    }

    @Test
    void testLogin_WrongPassword() {
        RegisterRequest regReq = new RegisterRequest();
        regReq.setUsername("userC");
        regReq.setPassword("secret");
        regReq.setPasswordConfirm("secret");
        authService.register(regReq);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setUsername("userC");
        loginReq.setPassword("wrong");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.login(loginReq));
        assertEquals("Nieprawidłowy login lub hasło.", ex.getMessage());
    }
    
    @Test
    void testLogin_NonexistentUser() {
        LoginRequest loginReq = new LoginRequest();
        loginReq.setUsername("ghost");
        loginReq.setPassword("boo");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.login(loginReq));
        assertEquals("Nieprawidłowy login lub hasło.", ex.getMessage());
    }
}
