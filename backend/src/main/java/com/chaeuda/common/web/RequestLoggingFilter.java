package com.chaeuda.common.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        long start = System.currentTimeMillis();
        try {
            chain.doFilter(req, res);
        } finally {
            long elapsed = System.currentTimeMillis() - start;
            int status = res.getStatus();
            String query = req.getQueryString();
            String path = req.getRequestURI() + (query != null ? "?" + query : "");
            if (status >= 500) {
                log.error("{} {} -> {} ({}ms)", req.getMethod(), path, status, elapsed);
            } else if (status >= 400) {
                log.warn("{} {} -> {} ({}ms)", req.getMethod(), path, status, elapsed);
            } else {
                log.info("{} {} -> {} ({}ms)", req.getMethod(), path, status, elapsed);
            }
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.startsWith("/files/") || uri.equals("/favicon.ico");
    }
}
