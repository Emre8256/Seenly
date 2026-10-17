package com.tensignal.backend.service;

import com.tensignal.backend.constant.OtpPurpose;

public interface OtpDeliveryService {
    void send(String email, String code, OtpPurpose purpose, String locale);

    default void send(String email, String code, OtpPurpose purpose) {
        send(email, code, purpose, "en");
    }
}
