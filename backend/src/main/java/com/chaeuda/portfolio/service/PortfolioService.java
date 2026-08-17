package com.chaeuda.portfolio.service;

import com.chaeuda.common.dto.PageResponse;
import com.chaeuda.common.exception.ApiException;
import com.chaeuda.file.ImageStorage;
import com.chaeuda.portfolio.domain.Category;
import com.chaeuda.portfolio.domain.Portfolio;
import com.chaeuda.portfolio.domain.PortfolioImage;
import com.chaeuda.portfolio.dto.*;
import com.chaeuda.portfolio.repository.PortfolioImageRepository;
import com.chaeuda.portfolio.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioImageRepository imageRepository;
    private final ImageStorage imageStorage;

    public PageResponse<PortfolioListItem> publicList(Category category, int page, int size) {
        Page<Portfolio> result = portfolioRepository
                .findAllByCategoryAndIsPublishedTrueOrderByCreatedAtDesc(category, PageRequest.of(page, size));
        Map<Long, String> thumbnails = thumbnailUrlsByPortfolio(result.getContent());
        return PageResponse.from(result.map(p -> toListItem(p, thumbnails.get(p.getId()))));
    }

    public PortfolioDetailResponse publicDetail(Long id) {
        Portfolio p = portfolioRepository.findByIdAndIsPublishedTrue(id)
                .orElseThrow(() -> ApiException.notFound("포트폴리오를 찾을 수 없습니다"));
        return toDetail(p);
    }

    public AdjacentResponse publicAdjacent(Long id, Category category) {
        portfolioRepository.findByIdAndIsPublishedTrue(id)
                .orElseThrow(() -> ApiException.notFound("포트폴리오를 찾을 수 없습니다"));

        AdjacentResponse.Neighbor prev = portfolioRepository
                .findFirstByCategoryAndIsPublishedTrueAndIdLessThanOrderByIdDesc(category, id)
                .map(p -> new AdjacentResponse.Neighbor(p.getId(), p.getTitle()))
                .orElse(null);
        AdjacentResponse.Neighbor next = portfolioRepository
                .findFirstByCategoryAndIsPublishedTrueAndIdGreaterThanOrderByIdAsc(category, id)
                .map(p -> new AdjacentResponse.Neighbor(p.getId(), p.getTitle()))
                .orElse(null);
        return new AdjacentResponse(prev, next);
    }

    public PageResponse<PortfolioListItem> adminList(Category category, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<Portfolio> result = (category == null)
                ? portfolioRepository.findAllByOrderByCreatedAtDesc(pageable)
                : portfolioRepository.findAllByCategoryOrderByCreatedAtDesc(category, pageable);
        Map<Long, String> thumbnails = thumbnailUrlsByPortfolio(result.getContent());
        return PageResponse.from(result.map(p -> toListItem(p, thumbnails.get(p.getId()))));
    }

    public PortfolioDetailResponse adminDetail(Long id) {
        Portfolio p = portfolioRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("포트폴리오를 찾을 수 없습니다"));
        return toDetail(p);
    }

    @Transactional
    public PortfolioDetailResponse create(PortfolioCreateRequest req) {
        Portfolio p = Portfolio.builder()
                .title(req.title())
                .category(req.category())
                .location(req.location())
                .areaSize(req.areaSize())
                .duration(req.duration())
                .description(req.description())
                .isPublished(req.isPublishedOrDefault())
                .build();
        portfolioRepository.save(p);
        return toDetail(p);
    }

    @Transactional
    public PortfolioDetailResponse update(Long id, PortfolioUpdateRequest req) {
        Portfolio p = portfolioRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("포트폴리오를 찾을 수 없습니다"));
        p.update(
                req.title(), req.category(), req.location(),
                req.areaSize(), req.duration(), req.description(),
                req.isPublished()
        );
        return toDetail(p);
    }

    @Transactional
    public void delete(Long id) {
        Portfolio p = portfolioRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("포트폴리오를 찾을 수 없습니다"));

        List<PortfolioImage> images = imageRepository.findAllByPortfolioIdOrderByDisplayOrderAsc(id);
        for (PortfolioImage img : images) {
            imageStorage.delete(img.getFilePath());
        }
        imageRepository.deleteAllByPortfolioId(id);
        portfolioRepository.delete(p);
    }

    private Map<Long, String> thumbnailUrlsByPortfolio(List<Portfolio> portfolios) {
        if (portfolios.isEmpty()) return Map.of();
        List<Long> ids = portfolios.stream().map(Portfolio::getId).toList();
        Map<Long, String> map = new HashMap<>();
        for (PortfolioImage img : imageRepository.findAllByPortfolioIdInAndIsThumbnailTrue(ids)) {
            map.put(img.getPortfolioId(), imageStorage.publicUrl(img.getFilePath()));
        }
        return map;
    }

    private PortfolioListItem toListItem(Portfolio p, String thumbnailUrl) {
        return new PortfolioListItem(
                p.getId(),
                p.getTitle(),
                p.getCategory(),
                p.getLocation(),
                p.getAreaSize(),
                p.getDuration(),
                p.isPublished(),
                p.getCreatedAt(),
                thumbnailUrl
        );
    }

    private PortfolioDetailResponse toDetail(Portfolio p) {
        List<PortfolioImageDto> images = imageRepository
                .findAllByPortfolioIdOrderByDisplayOrderAsc(p.getId())
                .stream()
                .map(this::imageToDto)
                .toList();
        return new PortfolioDetailResponse(
                p.getId(),
                p.getTitle(),
                p.getCategory(),
                p.getLocation(),
                p.getAreaSize(),
                p.getDuration(),
                p.getDescription(),
                p.isPublished(),
                p.getCreatedAt(),
                p.getUpdatedAt(),
                images
        );
    }

    private PortfolioImageDto imageToDto(PortfolioImage img) {
        return new PortfolioImageDto(
                img.getId(),
                imageStorage.publicUrl(img.getFilePath()),
                img.getOriginalName(),
                img.getDisplayOrder(),
                img.isThumbnail()
        );
    }
}
