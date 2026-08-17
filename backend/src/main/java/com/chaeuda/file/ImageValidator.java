package com.chaeuda.file;

import com.chaeuda.common.exception.ApiException;
import com.chaeuda.common.exception.ErrorCode;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

public final class ImageValidator {

    public static final long MAX_BYTES = 10L * 1024L * 1024L;
    public static final Set<String> ALLOWED_EXTS = Set.of("jpg", "jpeg", "png", "webp");
    public static final Set<String> ALLOWED_MIME = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private ImageValidator() {}

    public static void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("빈 파일입니다");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException(ErrorCode.PAYLOAD_TOO_LARGE,
                    "파일 크기가 10MB를 초과합니다 (현재 " + file.getSize() + " bytes)");
        }
        String name = file.getOriginalFilename();
        if (name == null || name.isBlank()) {
            throw ApiException.badRequest("파일명이 없습니다");
        }
        String ext = extension(name);
        if (!ALLOWED_EXTS.contains(ext)) {
            throw ApiException.badRequest("허용되지 않는 확장자입니다: " + (ext.isEmpty() ? "(없음)" : ext));
        }
        String contentType = file.getContentType();
        if (contentType == null) {
            throw ApiException.badRequest("Content-Type이 없습니다");
        }
        String lower = contentType.toLowerCase();
        if (!ALLOWED_MIME.contains(lower)) {
            throw ApiException.badRequest("허용되지 않는 MIME 타입입니다: " + contentType);
        }
    }

    private static String extension(String name) {
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) return "";
        return name.substring(dot + 1).toLowerCase();
    }
}
