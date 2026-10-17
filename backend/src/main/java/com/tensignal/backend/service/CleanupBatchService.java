package com.tensignal.backend.service;

import com.tensignal.backend.repository.OtpChallengeRepository;
import com.tensignal.backend.repository.RateLimitBucketRepository;
import com.tensignal.backend.repository.VerificationGrantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class CleanupBatchService {
    private final RateLimitBucketRepository rateLimitRepository;
    private final OtpChallengeRepository otpRepository;
    private final VerificationGrantRepository grantRepository;

    @Transactional
    public int expiredRateLimits(Instant cutoff, int batchSize) {
        var ids = rateLimitRepository.findExpiredKeys(cutoff, PageRequest.of(0, batchSize));
        rateLimitRepository.deleteAllByIdInBatch(ids);
        return ids.size();
    }

    @Transactional
    public int expiredOtps(Instant cutoff, int batchSize) {
        var ids = otpRepository.findExpiredKeys(cutoff, PageRequest.of(0, batchSize));
        otpRepository.deleteAllByIdInBatch(ids);
        return ids.size();
    }

    @Transactional
    public int expiredGrants(Instant cutoff, int batchSize) {
        var ids = grantRepository.findExpiredKeys(cutoff, PageRequest.of(0, batchSize));
        grantRepository.deleteAllByIdInBatch(ids);
        return ids.size();
    }
}
