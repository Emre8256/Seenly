package com.seenly.backend.observability;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ErrorMonitoringConfiguration {
    @Bean
    @ConditionalOnMissingBean(ErrorMonitor.class)
    ErrorMonitor noOpErrorMonitor() {
        return (error, context) -> { };
    }
}
