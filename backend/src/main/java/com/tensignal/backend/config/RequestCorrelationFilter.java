package com.tensignal.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.regex.Pattern;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter extends OncePerRequestFilter {
    public static final String REQUEST_ID_HEADER = "X-Request-ID";
    public static final String REQUEST_ID_MDC_KEY = "requestId";
    private static final Pattern SAFE_REQUEST_ID = Pattern.compile("[A-Za-z0-9][A-Za-z0-9._-]{0,63}");
    private static final Pattern UUID_SEGMENT = Pattern.compile("(?i)^[0-9a-f]{8}-[0-9a-f-]{27}$");
    private static final Pattern INTEGER_SEGMENT = Pattern.compile("^\\d+$");
    private static final Pattern OPAQUE_SEGMENT = Pattern.compile("^[A-Za-z0-9_-]{16,}$");
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String requestId = safeOrGenerated(request.getHeader(REQUEST_ID_HEADER));
        long started = System.nanoTime();
        MDC.put(REQUEST_ID_MDC_KEY, requestId);
        MDC.put("httpMethod", request.getMethod());
        MDC.put("httpPath", normalizedPath(request));
        response.setHeader(REQUEST_ID_HEADER, requestId);
        try {
            chain.doFilter(request, response);
        } finally {
            String statusStr = Integer.toString(response.getStatus());
            long durationMs = (System.nanoTime() - started) / 1_000_000;
            MDC.put("httpPath", normalizedPath(request));
            MDC.put("httpStatus", statusStr);
            MDC.put("durationMs", Long.toString(durationMs));
            log.info("http_request_completed {} {} -> {} ({}ms)", request.getMethod(), normalizedPath(request), statusStr, durationMs);
            MDC.remove("durationMs");
            MDC.remove("httpStatus");
            MDC.remove("httpPath");
            MDC.remove("httpMethod");
            MDC.remove(REQUEST_ID_MDC_KEY);
        }
    }

    static String safeOrGenerated(String candidate) {
        if (candidate != null && SAFE_REQUEST_ID.matcher(candidate).matches()) {
            return candidate;
        }
        byte[] bytes = new byte[18];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String normalizedPath(HttpServletRequest request) {
        Object pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        if (pattern instanceof String value && !value.isBlank()) {
            return value;
        }
        String[] segments = request.getRequestURI().split("/", -1);
        for (int i = 0; i < segments.length; i++) {
            if (UUID_SEGMENT.matcher(segments[i]).matches() || INTEGER_SEGMENT.matcher(segments[i]).matches()
                || OPAQUE_SEGMENT.matcher(segments[i]).matches()) {
                segments[i] = "{id}";
            }
        }
        return String.join("/", segments);
    }
}
