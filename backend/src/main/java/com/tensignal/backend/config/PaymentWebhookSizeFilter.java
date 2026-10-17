package com.tensignal.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class PaymentWebhookSizeFilter extends OncePerRequestFilter {
    private static final String WEBHOOK_PREFIX = "/api/billing/webhooks/";
    private static final String V1_WEBHOOK_PREFIX = "/api/v1/billing/webhooks/";
    private final PaymentProperties properties;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return !uri.startsWith(WEBHOOK_PREFIX) && !uri.startsWith(V1_WEBHOOK_PREFIX);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        int limit = properties.getMaxWebhookBytes();
        if (request.getContentLengthLong() > limit) {
            response.sendError(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
            return;
        }
        try {
            chain.doFilter(new LimitedBodyRequest(request, limit), response);
        } catch (PayloadTooLargeException ex) {
            if (!response.isCommitted()) {
                response.reset();
                response.sendError(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
            }
        }
    }

    private static final class LimitedBodyRequest extends HttpServletRequestWrapper {
        private final int limit;

        private LimitedBodyRequest(HttpServletRequest request, int limit) {
            super(request);
            this.limit = limit;
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            return new LimitedServletInputStream(super.getInputStream(), limit);
        }
    }

    private static final class LimitedServletInputStream extends ServletInputStream {
        private final ServletInputStream delegate;
        private final int limit;
        private int consumed;

        private LimitedServletInputStream(ServletInputStream delegate, int limit) {
            this.delegate = delegate;
            this.limit = limit;
        }

        @Override
        public int read() throws IOException {
            int value = delegate.read();
            if (value != -1 && ++consumed > limit) throw new PayloadTooLargeException();
            return value;
        }

        @Override
        public int read(byte[] bytes, int offset, int length) throws IOException {
            int read = delegate.read(bytes, offset, Math.min(length, limit - consumed + 1));
            if (read > 0 && (consumed += read) > limit) throw new PayloadTooLargeException();
            return read;
        }

        @Override public boolean isFinished() { return delegate.isFinished(); }
        @Override public boolean isReady() { return delegate.isReady(); }
        @Override public void setReadListener(ReadListener listener) { delegate.setReadListener(listener); }
    }

    private static final class PayloadTooLargeException extends IOException { }
}
