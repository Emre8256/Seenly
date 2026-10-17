package com.tensignal.backend.email;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public class FakeEmailProvider implements EmailSender {

    private final List<EmailMessage> sentMessages = Collections.synchronizedList(new ArrayList<>());
    private volatile boolean simulateFailure = false;
    private volatile boolean simulateDisabled = false;
    private volatile boolean transientFailure = true;

    @Override
    public EmailSendResult send(EmailMessage message) {
        if (simulateDisabled) {
            return EmailSendResult.disabled();
        }
        if (simulateFailure) {
            return EmailSendResult.failure("Simulated SMTP error", transientFailure);
        }
        sentMessages.add(message);
        return EmailSendResult.success("fake-msg-" + UUID.randomUUID());
    }

    @Override
    public String getProviderId() {
        return "fake";
    }

    public List<EmailMessage> getSentMessages() {
        return new ArrayList<>(sentMessages);
    }

    public void clear() {
        sentMessages.clear();
        simulateFailure = false;
        simulateDisabled = false;
        transientFailure = true;
    }

    public void setSimulateFailure(boolean simulateFailure, boolean transientFailure) {
        this.simulateFailure = simulateFailure;
        this.transientFailure = transientFailure;
    }

    public void setSimulateDisabled(boolean simulateDisabled) {
        this.simulateDisabled = simulateDisabled;
    }
}
