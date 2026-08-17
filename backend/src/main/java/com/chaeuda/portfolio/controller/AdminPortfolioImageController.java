package com.chaeuda.portfolio.controller;

import com.chaeuda.portfolio.dto.ImageOrderUpdateRequest;
import com.chaeuda.portfolio.dto.PortfolioImageDto;
import com.chaeuda.portfolio.service.PortfolioImageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin/portfolios/{portfolioId}/images")
@RequiredArgsConstructor
public class AdminPortfolioImageController {

    private final PortfolioImageService imageService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<PortfolioImageDto> upload(@PathVariable Long portfolioId,
                                          @RequestParam("files") MultipartFile[] files) throws IOException {
        return imageService.upload(portfolioId, files);
    }

    @PutMapping("/order")
    public List<PortfolioImageDto> reorder(@PathVariable Long portfolioId,
                                           @Valid @RequestBody ImageOrderUpdateRequest request) {
        return imageService.reorder(portfolioId, request);
    }

    @PutMapping("/{imageId}/thumbnail")
    public List<PortfolioImageDto> setThumbnail(@PathVariable Long portfolioId,
                                                @PathVariable Long imageId) {
        return imageService.setThumbnail(portfolioId, imageId);
    }

    @DeleteMapping("/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long portfolioId, @PathVariable Long imageId) {
        imageService.delete(portfolioId, imageId);
    }
}
