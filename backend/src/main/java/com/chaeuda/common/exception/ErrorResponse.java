package com.chaeuda.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldError> validationErrors
) {
    public static ErrorResponse of(ErrorCode errorCode, String message, String path) {
        return new ErrorResponse(
                Instant.now(),
                errorCode.status().value(),
                errorCode.code(),
                message,
                path,
                null
        );
    }

    public static ErrorResponse of(ErrorCode errorCode, String message, String path, List<FieldError> validationErrors) {
        return new ErrorResponse(
                Instant.now(),
                errorCode.status().value(),
                errorCode.code(),
                message,
                path,
                validationErrors
        );
    }

    public record FieldError(String field, String message) {}
}
