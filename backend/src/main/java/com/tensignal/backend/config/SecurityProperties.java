package com.tensignal.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {
    private List<String> allowedOrigins = new ArrayList<>();
    private List<String> trustedProxyCidrs = new ArrayList<>();
    private boolean secureHeaders = true;
    private boolean requireHttps = false;

    public List<String> getAllowedOrigins() { return allowedOrigins; }
    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins == null ? new ArrayList<>() : allowedOrigins;
    }
    public List<String> getTrustedProxyCidrs() { return trustedProxyCidrs; }
    public void setTrustedProxyCidrs(List<String> trustedProxyCidrs) {
        this.trustedProxyCidrs = trustedProxyCidrs == null ? new ArrayList<>() : trustedProxyCidrs;
    }
    public boolean isSecureHeaders() { return secureHeaders; }
    public void setSecureHeaders(boolean secureHeaders) { this.secureHeaders = secureHeaders; }
    public boolean isRequireHttps() { return requireHttps; }
    public void setRequireHttps(boolean requireHttps) { this.requireHttps = requireHttps; }
}
