package com.seenly.backend.email;

public interface EmailSender {

    /**
     * Attempts to send the given email message.
     * Implementations must not leak PII in exceptions or logs.
     *
     * @param message the email message to send
     * @return EmailSendResult containing outcome and provider metadata
     */
    EmailSendResult send(EmailMessage message);

    /**
     * Provider identifier (e.g. "disabled", "smtp", "fake").
     */
    String getProviderId();
}
