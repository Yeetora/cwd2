package com.chaeuda.file;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalImageStorageTest {

    @Test
    void store_creates_file_with_uuid_name_and_correct_extension(@TempDir Path tmp) throws IOException {
        LocalImageStorage storage = new LocalImageStorage(tmp.toString());
        byte[] content = "hello".getBytes();

        StoredFile result = storage.store(new ByteArrayInputStream(content), "photo.JPG", "portfolios/12");

        assertThat(result.originalName()).isEqualTo("photo.JPG");
        assertThat(result.filePath()).startsWith("portfolios/12/");
        assertThat(result.filePath()).endsWith(".jpg");

        Path savedFile = tmp.resolve(result.filePath());
        assertThat(Files.exists(savedFile)).isTrue();
        assertThat(Files.readAllBytes(savedFile)).isEqualTo(content);
    }

    @Test
    void store_without_extension(@TempDir Path tmp) throws IOException {
        LocalImageStorage storage = new LocalImageStorage(tmp.toString());

        StoredFile result = storage.store(new ByteArrayInputStream(new byte[]{1}), "noext", "portfolios/1");

        assertThat(result.filePath()).startsWith("portfolios/1/");
        assertThat(result.filePath()).doesNotContain(".");
    }

    @Test
    void publicUrl_prefixes_with_files(@TempDir Path tmp) {
        LocalImageStorage storage = new LocalImageStorage(tmp.toString());

        assertThat(storage.publicUrl("portfolios/12/abc.jpg"))
                .isEqualTo("/files/portfolios/12/abc.jpg");
    }

    @Test
    void delete_removes_existing_file(@TempDir Path tmp) throws IOException {
        LocalImageStorage storage = new LocalImageStorage(tmp.toString());
        StoredFile saved = storage.store(new ByteArrayInputStream(new byte[]{1}), "a.png", "portfolios/9");
        Path savedPath = tmp.resolve(saved.filePath());
        assertThat(Files.exists(savedPath)).isTrue();

        storage.delete(saved.filePath());

        assertThat(Files.exists(savedPath)).isFalse();
    }

    @Test
    void delete_does_not_throw_when_file_missing(@TempDir Path tmp) {
        LocalImageStorage storage = new LocalImageStorage(tmp.toString());

        storage.delete("portfolios/999/never.jpg");
    }

    @Test
    void store_rejects_path_traversal_prefix(@TempDir Path tmp) {
        LocalImageStorage storage = new LocalImageStorage(tmp.toString());
        InputStream in = new ByteArrayInputStream(new byte[]{1});

        assertThatThrownBy(() -> storage.store(in, "x.jpg", "../escape"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void delete_rejects_path_traversal(@TempDir Path tmp) throws IOException {
        LocalImageStorage storage = new LocalImageStorage(tmp.toString());

        Path outside = tmp.getParent().resolve("outside.txt");
        Files.writeString(outside, "secret");
        try {
            storage.delete("../outside.txt");
            assertThat(Files.exists(outside)).isTrue();
        } finally {
            Files.deleteIfExists(outside);
        }
    }
}
