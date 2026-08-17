package com.chaeuda.admin.auth;

import com.chaeuda.admin.domain.AdminUser;

public record AdminInfoResponse(Long id, String username, String email) {
    public static AdminInfoResponse from(AdminUser user) {
        return new AdminInfoResponse(user.getId(), user.getUsername(), user.getEmail());
    }
}
