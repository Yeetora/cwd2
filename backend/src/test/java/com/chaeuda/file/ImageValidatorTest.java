package com.chaeuda.file;

import com.chaeuda.common.exception.ApiException;
import com.chaeuda.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ImageValidatorTest {

    @Test
    void valid_jpeg_passes() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});

        assertThatCode(() -> ImageValidator.validate(file)).doesNotThrowAnyException();
    }

    @Test
    void valid_png_passes() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "logo.PNG", "image/png", new byte[]{1});

        assertThatCode(() -> ImageValidator.validate(file)).doesNotThrowAnyException();
    }

    @Test
    void valid_webp_passes() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "asset.webp", "image/webp", new byte[]{1});

        assertThatCode(() -> ImageValidator.validate(file)).doesNotThrowAnyException();
    }

    @Test
    void rejects_empty_file() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "empty.jpg", "image/jpeg", new byte[0]);

        assertThatThrownBy(() -> ImageValidator.validate(file))
                .isInstanceOf(ApiException.class)
                .matches(e -> ((ApiException) e).getErrorCode() == ErrorCode.BAD_REQUEST);
    }

    @Test
    void rejects_too_large_file() {
        byte[] big = new byte[(int) ImageValidator.MAX_BYTES + 1];
        MockMultipartFile file = new MockMultipartFile(
                "file", "huge.jpg", "image/jpeg", big);

        assertThatThrownBy(() -> ImageValidator.validate(file))
                .isInstanceOf(ApiException.class)
                .matches(e -> ((ApiException) e).getErrorCode() == ErrorCode.PAYLOAD_TOO_LARGE);
    }

    @Test
    void rejects_disallowed_extension() {
        MockMultipartFile gif = new MockMultipartFile(
                "file", "animated.gif", "image/gif", new byte[]{1});

        assertThatThrownBy(() -> ImageValidator.validate(gif))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void rejects_executable() {
        MockMultipartFile exe = new MockMultipartFile(
                "file", "malware.exe", "application/octet-stream", new byte[]{1});

        assertThatThrownBy(() -> ImageValidator.validate(exe))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void rejects_missing_filename() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "", "image/jpeg", new byte[]{1});

        assertThatThrownBy(() -> ImageValidator.validate(file))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void rejects_disallowed_mime_even_when_extension_ok() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "fake.jpg", "text/html", new byte[]{1});

        assertThatThrownBy(() -> ImageValidator.validate(file))
                .isInstanceOf(ApiException.class);
    }
}
