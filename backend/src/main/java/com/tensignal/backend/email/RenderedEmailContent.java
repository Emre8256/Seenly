package com.tensignal.backend.email;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RenderedEmailContent {
    private final String subject;
    private final String htmlBody;
    private final String textBody;
}
