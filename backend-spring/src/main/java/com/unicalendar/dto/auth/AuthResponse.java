package com.unicalendar.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {

    private UserInfo user;
    private String access;
    private String refresh;

    @Data
    @Builder
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String username;
        private String email;
        private Boolean isStaff;
    }
}
