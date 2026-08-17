package com.chaeuda.file;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class S3ImageStorageTest {

    private final StorageProperties propertiesWithBase = new StorageProperties("s3",
            new StorageProperties.S3("my-bucket", "ap-northeast-2", "https://cdn.example.com", null));

    private final StorageProperties propertiesWithoutBase = new StorageProperties("s3",
            new StorageProperties.S3("my-bucket", "ap-northeast-2", null, null));

    @Test
    void store_uploads_to_s3_with_correct_key_and_content_type() throws IOException {
        S3Client s3 = mock(S3Client.class);
        S3ImageStorage storage = new S3ImageStorage(s3, propertiesWithBase);
        byte[] content = "hello".getBytes();

        StoredFile result = storage.store(new ByteArrayInputStream(content), "photo.JPG", "portfolios/12");

        assertThat(result.originalName()).isEqualTo("photo.JPG");
        assertThat(result.filePath()).startsWith("portfolios/12/");
        assertThat(result.filePath()).endsWith(".jpg");

        ArgumentCaptor<PutObjectRequest> req = ArgumentCaptor.forClass(PutObjectRequest.class);
        ArgumentCaptor<RequestBody> body = ArgumentCaptor.forClass(RequestBody.class);
        verify(s3).putObject(req.capture(), body.capture());

        assertThat(req.getValue().bucket()).isEqualTo("my-bucket");
        assertThat(req.getValue().key()).isEqualTo(result.filePath());
        assertThat(req.getValue().contentType()).isEqualTo("image/jpeg");
        assertThat(req.getValue().contentLength()).isEqualTo((long) content.length);
    }

    @Test
    void store_without_extension_still_uploads() throws IOException {
        S3Client s3 = mock(S3Client.class);
        S3ImageStorage storage = new S3ImageStorage(s3, propertiesWithBase);

        StoredFile result = storage.store(new ByteArrayInputStream(new byte[]{1}), "noext", "portfolios/1");

        assertThat(result.filePath()).startsWith("portfolios/1/");
        assertThat(result.filePath()).doesNotContain(".");
        verify(s3).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void store_rejects_path_traversal_prefix() {
        S3Client s3 = mock(S3Client.class);
        S3ImageStorage storage = new S3ImageStorage(s3, propertiesWithBase);
        InputStream in = new ByteArrayInputStream(new byte[]{1});

        assertThatThrownBy(() -> storage.store(in, "x.jpg", "../escape"))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(s3);
    }

    @Test
    void publicUrl_with_public_url_base() {
        S3Client s3 = mock(S3Client.class);
        S3ImageStorage storage = new S3ImageStorage(s3, propertiesWithBase);

        assertThat(storage.publicUrl("portfolios/12/abc.jpg"))
                .isEqualTo("https://cdn.example.com/portfolios/12/abc.jpg");
    }

    @Test
    void publicUrl_without_public_url_base_uses_s3_default_host() {
        S3Client s3 = mock(S3Client.class);
        S3ImageStorage storage = new S3ImageStorage(s3, propertiesWithoutBase);

        assertThat(storage.publicUrl("portfolios/12/abc.jpg"))
                .isEqualTo("https://my-bucket.s3.ap-northeast-2.amazonaws.com/portfolios/12/abc.jpg");
    }

    @Test
    void publicUrl_strips_trailing_slash_from_base() {
        StorageProperties props = new StorageProperties("s3",
                new StorageProperties.S3("my-bucket", "ap-northeast-2", "https://cdn.example.com/", null));
        S3ImageStorage storage = new S3ImageStorage(mock(S3Client.class), props);

        assertThat(storage.publicUrl("a.jpg")).isEqualTo("https://cdn.example.com/a.jpg");
    }

    @Test
    void delete_sends_delete_object_request() {
        S3Client s3 = mock(S3Client.class);
        S3ImageStorage storage = new S3ImageStorage(s3, propertiesWithBase);

        storage.delete("portfolios/12/abc.jpg");

        ArgumentCaptor<DeleteObjectRequest> req = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3).deleteObject(req.capture());
        assertThat(req.getValue().bucket()).isEqualTo("my-bucket");
        assertThat(req.getValue().key()).isEqualTo("portfolios/12/abc.jpg");
    }

    @Test
    void delete_does_not_throw_on_missing_key() {
        S3Client s3 = mock(S3Client.class);
        when(s3.deleteObject(any(DeleteObjectRequest.class)))
                .thenThrow(NoSuchKeyException.builder().message("not found").build());
        S3ImageStorage storage = new S3ImageStorage(s3, propertiesWithBase);

        storage.delete("missing.jpg"); // 예외 미발생
    }

    @Test
    void delete_does_not_throw_on_null_or_blank() {
        S3Client s3 = mock(S3Client.class);
        S3ImageStorage storage = new S3ImageStorage(s3, propertiesWithBase);

        storage.delete(null);
        storage.delete("");
        storage.delete("   ");

        verifyNoInteractions(s3);
    }

    @Test
    void constructor_rejects_empty_bucket() {
        StorageProperties props = new StorageProperties("s3",
                new StorageProperties.S3("", "ap-northeast-2", null, null));

        assertThatThrownBy(() -> new S3ImageStorage(mock(S3Client.class), props))
                .isInstanceOf(IllegalStateException.class);
    }
}
