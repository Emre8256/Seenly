package com.tensignal.backend.exception;

import com.tensignal.backend.observability.ErrorMonitor;
import com.tensignal.backend.observability.ApplicationMetrics;
import com.tensignal.backend.observability.AuditEvent;
import com.tensignal.backend.observability.AuditLogService;
import com.tensignal.backend.config.RequestCorrelationFilter;

import jakarta.validation.ConstraintViolationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class GlobalExceptionHandler {
    private final ErrorMonitor errorMonitor;
    private final ApplicationMetrics metrics;
    private final AuditLogService auditLogService;

    @ExceptionHandler(EmailDeliveryException.class)
    public ResponseEntity<ErrorResponse> handleEmailDelivery(EmailDeliveryException ex, WebRequest request) {
        return controlled(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidPaymentSignatureException.class)
    public ResponseEntity<Map<String, String>> handleInvalidPaymentSignature(InvalidPaymentSignatureException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("status", "error", "message", ex.getMessage()));
    }

    @ExceptionHandler(PaymentProviderUnavailableException.class)
    public ResponseEntity<Map<String, String>> handlePaymentProviderUnavailable(PaymentProviderUnavailableException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("status", "error", "message", ex.getMessage()));
    }

    @ExceptionHandler(InvalidPaymentEventException.class)
    public ResponseEntity<Map<String, String>> handleInvalidPaymentEvent(InvalidPaymentEventException ex) {
        return ResponseEntity.badRequest().body(Map.of("status", "error", "message", ex.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
            "status", "error", "message", "The request conflicts with an existing record."));
    }

    @ExceptionHandler(PessimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handlePessimisticLockFailure(
            PessimisticLockingFailureException ex, WebRequest request) {
        metrics.resilienceFailure("concurrency");
        auditLogService.record(AuditEvent.CONCURRENCY_FAILURE, "failure");
        log.warn("concurrency_operation_failed exceptionType={}", ex.getClass().getSimpleName());
        return controlled(HttpStatus.CONFLICT,
            "The operation conflicted with another request. Please try again.", request);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> handleDatabaseFailure(DataAccessException ex, WebRequest request) {
        metrics.resilienceFailure("database");
        auditLogService.record(AuditEvent.INFRASTRUCTURE_FAILURE, "failure", Map.of("reason", "database"));
        log.warn("database_operation_failed exceptionType={}", ex.getClass().getSimpleName());
        return controlled(HttpStatus.SERVICE_UNAVAILABLE,
            "The service is temporarily unavailable. Please try again shortly.", request);
    }

    @ExceptionHandler(OwnerAuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleOwnerAuthenticationException(OwnerAuthenticationException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.UNAUTHORIZED.value(),
            HttpStatus.UNAUTHORIZED.getReasonPhrase(),
            ex.getMessage(),
            getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleEmailAlreadyExistsException(EmailAlreadyExistsException ex) {
        Map<String, String> body = new HashMap<>();
        body.put("status", "error");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(EmailNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleEmailNotFoundException(EmailNotFoundException ex) {
        Map<String, String> body = new HashMap<>();
        body.put("status", "error");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.NOT_FOUND.value(),
            HttpStatus.NOT_FOUND.getReasonPhrase(),
            ex.getMessage(),
            getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(CooldownActiveException.class)
    public ResponseEntity<Map<String, String>> handleCooldownActiveException(CooldownActiveException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
            "message", ex.getMessage(),
            "nextAllowedDate", ex.getNextAllowedDate().toString(),
            "daysRemaining", String.valueOf(ex.getDaysRemaining())
        ));
    }

    @ExceptionHandler(OtpCooldownException.class)
    public ResponseEntity<Map<String, Object>> handleOtpCooldownException(OtpCooldownException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
            "status", "error",
            "message", ex.getMessage(),
            "retryAfterSeconds", ex.getRetryAfterSeconds()
        ));
    }

    @ExceptionHandler(VerificationException.class)
    public ResponseEntity<Map<String, String>> handleVerificationException(VerificationException ex) {
        Map<String, String> body = new HashMap<>();
        body.put("status", "error");
        body.put("message", ex.getMessage());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(DuplicateResponseException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateResponseException(DuplicateResponseException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
            "status", "error", "eligible", false, "message", ex.getMessage()));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleRateLimitExceededException(RateLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
            "status", "error", "message", ex.getMessage(), "retryAfterSeconds", ex.getRetryAfterSeconds()));
    }

    @ExceptionHandler(SelfEvaluationException.class)
    public ResponseEntity<Map<String, Object>> handleSelfEvaluationException(SelfEvaluationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", ex.getMessage());
        body.put("eligible", false);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(QuotaExceededException.class)
    public ResponseEntity<ErrorResponse> handleQuotaExceededException(QuotaExceededException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.FORBIDDEN.value(),
            HttpStatus.FORBIDDEN.getReasonPhrase(),
            ex.getMessage(),
            getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, WebRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : (error.getField() + " is invalid"))
            .collect(Collectors.joining(", "));

        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            message,
            getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(ConstraintViolationException ex, WebRequest request) {
        String message = ex.getConstraintViolations().stream()
            .map(cv -> cv.getMessage() != null ? cv.getMessage() : cv.getPropertyPath().toString())
            .collect(Collectors.joining(", "));

        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            message,
            getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            ex.getMessage(),
            getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ErrorResponse> handleMissingRequestHeaderException(MissingRequestHeaderException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            "Required header '" + ex.getHeaderName() + "' is missing",
            getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestParameterException(MissingServletRequestParameterException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            "Required parameter '" + ex.getParameterName() + "' is missing",
            getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            "Malformed JSON request body",
            getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            "Parameter '" + ex.getName() + "' has invalid type",
            getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLockingFailureException(ObjectOptimisticLockingFailureException ex, WebRequest request) {
        metrics.resilienceFailure("concurrency");
        auditLogService.record(AuditEvent.CONCURRENCY_FAILURE, "failure");
        log.warn("concurrency_operation_failed exceptionType={}", ex.getClass().getSimpleName());
        return controlled(HttpStatus.CONFLICT,
            "Multiple simultaneous responses detected. Please try submitting again.", request);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFoundException(NoResourceFoundException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.NOT_FOUND.value(),
            HttpStatus.NOT_FOUND.getReasonPhrase(),
            "Resource not found",
            getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, WebRequest request) {
        String requestId = MDC.get("requestId");
        String method = request instanceof ServletWebRequest servletRequest
            ? servletRequest.getRequest().getMethod() : "UNKNOWN";
        String normalizedPath = request instanceof ServletWebRequest servletRequest
            ? RequestCorrelationFilter.normalizedPath(servletRequest.getRequest()) : "UNKNOWN";
        try {
            errorMonitor.capture(ex, new ErrorMonitor.ErrorContext(requestId, method, normalizedPath));
        } catch (RuntimeException monitorFailure) {
            log.warn("error_monitor_capture_failed providerExceptionType={}",
                monitorFailure.getClass().getSimpleName());
        }
        log.error("unexpected_server_error exceptionType={}", ex.getClass().getSimpleName());
        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
            "An unexpected server error occurred",
            getPath(request)
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private String getPath(WebRequest request) {
        return request.getDescription(false).replace("uri=", "");
    }

    private ResponseEntity<ErrorResponse> controlled(HttpStatus status, String message, WebRequest request) {
        return new ResponseEntity<>(new ErrorResponse(LocalDateTime.now(), status.value(),
            status.getReasonPhrase(), message, getPath(request)), status);
    }
}
