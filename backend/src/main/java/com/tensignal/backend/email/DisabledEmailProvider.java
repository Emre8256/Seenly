package com.tensignal.backend.email;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class DisabledEmailProvider implements EmailSender {

    @Override
    public EmailSendResult send(EmailMessage message) {
        log.debug("Email provider is disabled. Skipping delivery for notificationType={}",
            message.getNotificationType());
        return EmailSendResult.disabled();
    }

    @Override
    public String getProviderId() {
        return "disabled";
    }
}
