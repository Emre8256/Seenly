package com.seenly.backend.service;

import com.seenly.backend.constant.OtpPurpose;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Profile("!prod")
public class DevOtpDeliveryService implements OtpDeliveryService {

    @Override
    public void send(String email, String code, OtpPurpose purpose) {
        log.info("""
            
            ==================================================
            [DEV OTP CODE]
            To: {}
            Purpose: {}
            CODE: {}
            ==================================================""", email, purpose, code);
    }
}
