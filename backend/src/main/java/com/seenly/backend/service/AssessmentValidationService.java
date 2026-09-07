package com.seenly.backend.service;

import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.dto.CreateSeenlyRequest;
import com.seenly.backend.dto.FriendResponseInput;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AssessmentValidationService {
    private static final Set<String> SELF_IDS = expected("classic_self_");
    private static final Set<String> FRIEND_IDS = expected("classic_friend_");
    private static final int MAX_TIMING_MS = 600_000;

    public void validateSelfAnswers(java.util.List<CreateSeenlyRequest.SelfAnswerInput> answers) {
        validateExactSet(answers.stream().map(CreateSeenlyRequest.SelfAnswerInput::getQuestionId).toList(), SELF_IDS);
    }

    public void validateFriendSubmission(FriendResponseInput request) {
        validateExactSet(request.getFriendResponses().stream().map(FriendResponseInput.AnswerInput::getQuestionId).toList(), FRIEND_IDS);
        Map<String, Integer> timing = request.getFriendTimeAnalytics();
        if (timing == null) return;
        if (timing.size() > AppConstants.LENSES.size()) {
            throw new IllegalArgumentException("Timing analytics contains too many entries.");
        }
        for (Map.Entry<String, Integer> entry : timing.entrySet()) {
            if (!AppConstants.LENSES.contains(entry.getKey()) || entry.getValue() == null
                || entry.getValue() < 0 || entry.getValue() > MAX_TIMING_MS) {
                throw new IllegalArgumentException("Timing analytics contains an invalid key or duration.");
            }
        }
    }

    private void validateExactSet(java.util.List<String> supplied, Set<String> expected) {
        Set<String> unique = new HashSet<>(supplied);
        if (unique.size() != supplied.size()) {
            throw new IllegalArgumentException("Assessment contains a duplicate question ID.");
        }
        if (!unique.equals(expected)) {
            throw new IllegalArgumentException("Assessment must contain every expected question exactly once and no unknown questions.");
        }
    }

    private static Set<String> expected(String prefix) {
        return AppConstants.LENSES.stream().map(lens -> prefix + lens + "_01").collect(Collectors.toUnmodifiableSet());
    }
}
