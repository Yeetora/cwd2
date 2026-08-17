package com.chaeuda.portfolio.service;

import com.chaeuda.common.exception.ApiException;
import com.chaeuda.file.ImageStorage;
import com.chaeuda.file.ImageValidator;
import com.chaeuda.file.StoredFile;
import com.chaeuda.portfolio.domain.Portfolio;
import com.chaeuda.portfolio.domain.PortfolioImage;
import com.chaeuda.portfolio.dto.ImageOrderUpdateRequest;
import com.chaeuda.portfolio.dto.PortfolioImageDto;
import com.chaeuda.portfolio.repository.PortfolioImageRepository;
import com.chaeuda.portfolio.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PortfolioImageService {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioImageRepository imageRepository;
    private final ImageStorage imageStorage;

    @Transactional
    public List<PortfolioImageDto> upload(Long portfolioId, MultipartFile[] files) throws IOException {
        ensurePortfolioExists(portfolioId);

        if (files == null || files.length == 0) {
            throw ApiException.badRequest("업로드할 파일이 없습니다");
        }

        long currentCount = imageRepository.countByPortfolioId(portfolioId);
        if (currentCount + files.length > Portfolio.MAX_IMAGES) {
            throw ApiException.badRequest(
                    "포트폴리오당 이미지는 최대 " + Portfolio.MAX_IMAGES + "장입니다 (현재 "
                            + currentCount + ", 추가 " + files.length + ")");
        }

        for (MultipartFile file : files) {
            ImageValidator.validate(file);
        }

        boolean hasThumbnail = imageRepository.findByPortfolioIdAndIsThumbnailTrue(portfolioId).isPresent();
        int nextOrder = (int) currentCount;

        List<PortfolioImage> created = new ArrayList<>();
        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            StoredFile stored;
            try (InputStream in = file.getInputStream()) {
                stored = imageStorage.store(in, file.getOriginalFilename(), "portfolios/" + portfolioId);
            }
            boolean isThumb = !hasThumbnail && i == 0;
            if (isThumb) {
                hasThumbnail = true;
            }
            PortfolioImage img = PortfolioImage.builder()
                    .portfolioId(portfolioId)
                    .filePath(stored.filePath())
                    .originalName(stored.originalName())
                    .displayOrder(nextOrder + i)
                    .isThumbnail(isThumb)
                    .build();
            created.add(imageRepository.save(img));
        }
        return created.stream().map(this::toDto).toList();
    }

    @Transactional
    public List<PortfolioImageDto> reorder(Long portfolioId, ImageOrderUpdateRequest request) {
        ensurePortfolioExists(portfolioId);
        List<PortfolioImage> existing = imageRepository.findAllByPortfolioIdOrderByDisplayOrderAsc(portfolioId);

        if (request.orders().size() != existing.size()) {
            throw ApiException.badRequest(
                    "순서 변경 요청은 포트폴리오의 모든 이미지("
                            + existing.size() + "장)를 포함해야 합니다 (요청 " + request.orders().size() + "건)");
        }

        Map<Long, PortfolioImage> byId = existing.stream()
                .collect(Collectors.toMap(PortfolioImage::getId, Function.identity()));

        Set<Long> seen = new HashSet<>();
        for (ImageOrderUpdateRequest.Entry entry : request.orders()) {
            if (!seen.add(entry.imageId())) {
                throw ApiException.badRequest("중복된 imageId: " + entry.imageId());
            }
            PortfolioImage img = byId.get(entry.imageId());
            if (img == null) {
                throw ApiException.badRequest("imageId " + entry.imageId() + "이 포트폴리오에 속하지 않습니다");
            }
            img.changeDisplayOrder(entry.order());
        }

        return imageRepository.findAllByPortfolioIdOrderByDisplayOrderAsc(portfolioId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public List<PortfolioImageDto> setThumbnail(Long portfolioId, Long imageId) {
        ensurePortfolioExists(portfolioId);

        PortfolioImage target = imageRepository.findById(imageId)
                .filter(img -> img.getPortfolioId().equals(portfolioId))
                .orElseThrow(() -> ApiException.notFound("이미지를 찾을 수 없습니다"));

        imageRepository.findByPortfolioIdAndIsThumbnailTrue(portfolioId)
                .ifPresent(PortfolioImage::unmarkThumbnail);
        target.markAsThumbnail();

        return imageRepository.findAllByPortfolioIdOrderByDisplayOrderAsc(portfolioId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public void delete(Long portfolioId, Long imageId) {
        ensurePortfolioExists(portfolioId);

        PortfolioImage target = imageRepository.findById(imageId)
                .filter(img -> img.getPortfolioId().equals(portfolioId))
                .orElseThrow(() -> ApiException.notFound("이미지를 찾을 수 없습니다"));

        boolean wasThumbnail = target.isThumbnail();
        String pathToDelete = target.getFilePath();
        imageRepository.delete(target);
        imageRepository.flush();
        imageStorage.delete(pathToDelete);

        if (wasThumbnail) {
            imageRepository.findAllByPortfolioIdOrderByDisplayOrderAsc(portfolioId)
                    .stream().findFirst()
                    .ifPresent(PortfolioImage::markAsThumbnail);
        }
    }

    private void ensurePortfolioExists(Long portfolioId) {
        if (!portfolioRepository.existsById(portfolioId)) {
            throw ApiException.notFound("포트폴리오를 찾을 수 없습니다");
        }
    }

    private PortfolioImageDto toDto(PortfolioImage img) {
        return new PortfolioImageDto(
                img.getId(),
                imageStorage.publicUrl(img.getFilePath()),
                img.getOriginalName(),
                img.getDisplayOrder(),
                img.isThumbnail()
        );
    }
}
