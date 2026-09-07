package com.seenly.backend.service;

import com.seenly.backend.constant.OtpPurpose;

public interface OtpDeliveryService {
    void send(String email, String code, OtpPurpose purpose);
}
