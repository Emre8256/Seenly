package com.tensignal.backend.email;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class EmailTemplateService {

    private static final String CANONICAL_FALLBACK_LOCALE = "en";
    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{(\\w+)}}");

    private final ObjectMapper objectMapper;
    private final Map<String, Map<String, TemplateDefinition>> localeTemplates = new ConcurrentHashMap<>();
    private final Set<String> supportedLocales = ConcurrentHashMap.newKeySet();

    public EmailTemplateService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Getter
    @Setter
    public static class TemplateDefinition {
        private String subject;
        private String preheader;
        private String title;
        private String body;
        private String ctaText;
        private String ctaUrl;
        private String footer;
        private String plainText;
    }

    @PostConstruct
    public void init() {
        loadTemplates();
    }

    public void loadTemplates() {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath*:i18n/email/*/notifications.json");

            for (Resource resource : resources) {
                String uri = resource.getURI().toString();
                // extract locale from path .../i18n/email/{locale}/notifications.json
                String[] parts = uri.split("/i18n/email/");
                if (parts.length > 1) {
                    String sub = parts[1];
                    int slashIdx = sub.indexOf('/');
                    if (slashIdx > 0) {
                        String localeCode = sub.substring(0, slashIdx).toLowerCase(Locale.ROOT);
                        try (InputStream is = resource.getInputStream()) {
                            Map<String, TemplateDefinition> defs = objectMapper.readValue(
                                is, new TypeReference<Map<String, TemplateDefinition>>() {}
                            );
                            localeTemplates.put(localeCode, defs);
                            supportedLocales.add(localeCode);
                            log.info("Loaded email templates for locale: {}", localeCode);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to load some email locale templates: {}", e.getMessage());
        }

        if (!supportedLocales.contains(CANONICAL_FALLBACK_LOCALE)) {
            log.warn("Canonical fallback locale '{}' was not loaded from resources!", CANONICAL_FALLBACK_LOCALE);
        }
    }

    /**
     * Resolves the best-matching locale:
     * requested -> language component -> canonical fallback (en)
     */
    public String resolveLocale(String requestedLocale) {
        if (requestedLocale == null || requestedLocale.isBlank()) {
            return supportedLocales.contains(CANONICAL_FALLBACK_LOCALE) ? CANONICAL_FALLBACK_LOCALE : "en";
        }
        String normalized = requestedLocale.trim().toLowerCase(Locale.ROOT);
        if (supportedLocales.contains(normalized)) {
            return normalized;
        }
        // Try language prefix (e.g. tr-TR -> tr)
        int dashIdx = normalized.indexOf('-');
        if (dashIdx > 0) {
            String lang = normalized.substring(0, dashIdx);
            if (supportedLocales.contains(lang)) {
                return lang;
            }
        }
        int underIdx = normalized.indexOf('_');
        if (underIdx > 0) {
            String lang = normalized.substring(0, underIdx);
            if (supportedLocales.contains(lang)) {
                return lang;
            }
        }
        return supportedLocales.contains(CANONICAL_FALLBACK_LOCALE) ? CANONICAL_FALLBACK_LOCALE : "en";
    }

    public RenderedEmailContent render(NotificationType type, String locale, Map<String, Object> context) {
        String resolvedLocale = resolveLocale(locale);
        TemplateDefinition template = getTemplate(type.name(), resolvedLocale);
        if (template == null) {
            template = getTemplate(type.name(), CANONICAL_FALLBACK_LOCALE);
        }
        if (template == null) {
            throw new IllegalStateException("Missing email template for " + type + " in locale " + resolvedLocale);
        }

        Map<String, Object> safeContext = context == null ? Collections.emptyMap() : context;

        String rawSubject = replaceVariables(template.getSubject(), safeContext, false);
        String safeSubject = stripCrlf(rawSubject);

        String title = replaceVariables(template.getTitle(), safeContext, true);
        String preheader = replaceVariables(template.getPreheader(), safeContext, true);
        String body = replaceVariables(template.getBody(), safeContext, true);

        // Strict CTA gating per brand & security rules:
        // CTA buttons are allowed ONLY for:
        // FIRST_SHARE_REMINDER, NEW_EVALUATION, REPORT_UNLOCKED, INACTIVITY_REMINDER,
        // CAPACITY_80_PERCENT, CAPACITY_FULL, SOCIAL_CARD_CHANGED.
        // OTP and transactional information emails MUST NOT have any CTA buttons.
        boolean isCtaAllowed = switch (type) {
            case FIRST_SHARE_REMINDER,
                 NEW_EVALUATION,
                 REPORT_UNLOCKED,
                 INACTIVITY_REMINDER,
                 CAPACITY_80_PERCENT,
                 CAPACITY_FULL,
                 SOCIAL_CARD_CHANGED -> true;
            default -> false;
        };

        String ctaText = null;
        String ctaUrl = null;
        if (isCtaAllowed) {
            ctaText = replaceVariables(template.getCtaText(), safeContext, true);
            String rawCtaUrl = replaceVariables(template.getCtaUrl(), safeContext, false);
            ctaUrl = (rawCtaUrl != null && !rawCtaUrl.isBlank()) ? rawCtaUrl : "https://10signal.me";
            if (ctaUrl.contains("tensignal.app")) {
                ctaUrl = ctaUrl.replace("tensignal.app", "10signal.me");
            }
        }

        String footer = replaceVariables(template.getFooter(), safeContext, true);

        // Defensively sanitize legacy tensignal.app domain references
        if (body != null && body.contains("tensignal.app")) {
            body = body.replace("tensignal.app", "10signal.me");
        }
        if (footer != null && footer.contains("tensignal.app")) {
            footer = footer.replace("tensignal.app", "10signal.me");
        }

        String htmlBody = buildHtmlLayout(safeSubject, preheader, title, body, ctaText, ctaUrl, footer, resolvedLocale);
        String textBody = replaceVariables(template.getPlainText(), safeContext, false);
        if (textBody != null && textBody.contains("tensignal.app")) {
            textBody = textBody.replace("tensignal.app", "10signal.me");
        }

        return RenderedEmailContent.builder()
            .subject(safeSubject)
            .htmlBody(htmlBody)
            .textBody(textBody)
            .build();
    }

    private TemplateDefinition getTemplate(String typeName, String locale) {
        Map<String, TemplateDefinition> map = localeTemplates.get(locale);
        return map != null ? map.get(typeName) : null;
    }

    public String replaceVariables(String text, Map<String, Object> context, boolean escapeHtml) {
        if (text == null) {
            return "";
        }
        Matcher matcher = VARIABLE_PATTERN.matcher(text);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String key = matcher.group(1);
            Object val = context.get(key);
            String replacement = val != null ? String.valueOf(val) : "";
            if (escapeHtml) {
                replacement = escapeHtml(replacement);
            }
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    public static String escapeHtml(String input) {
        if (input == null) return "";
        StringBuilder out = new StringBuilder(Math.max(16, input.length()));
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            switch (c) {
                case '<': out.append("&lt;"); break;
                case '>': out.append("&gt;"); break;
                case '&': out.append("&amp;"); break;
                case '"': out.append("&quot;"); break;
                case '\'': out.append("&#39;"); break;
                default: out.append(c); break;
            }
        }
        return out.toString();
    }

    private String stripCrlf(String input) {
        if (input == null) return "";
        return input.replace("\r", "").replace("\n", "").trim();
    }

    private String buildHtmlLayout(String subject, String preheader, String title, String body,
                                   String ctaText, String ctaUrl, String footer, String resolvedLocale) {
        boolean hasCta = ctaText != null && !ctaText.isBlank() && ctaUrl != null && !ctaUrl.isBlank();

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>\n");
        sb.append("<html lang=\"").append(escapeHtml(resolvedLocale != null ? resolvedLocale : "en")).append("\" xmlns=\"http://www.w3.org/1999/xhtml\">\n");
        sb.append("<head>\n");
        sb.append("<meta charset=\"UTF-8\">\n");
        sb.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n");
        sb.append("<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n");
        sb.append("<title>").append(escapeHtml(subject)).append("</title>\n");
        sb.append("<style>\n");
        sb.append("  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #F7EFE4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #6E5A4A; }\n");
        sb.append("  table { border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }\n");
        sb.append("  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }\n");
        sb.append("  .email-container { max-width: 580px; margin: 0 auto; width: 100%; }\n");
        sb.append("  .email-card { background-color: #FFFDF9; border: 1px solid #E6D5C2; border-radius: 16px; padding: 36px 32px; }\n");
        sb.append("  .brand-logo { font-size: 22px; font-weight: 700; color: #3D2C23; text-decoration: none; letter-spacing: -0.5px; }\n");
        sb.append("  .email-title { font-size: 22px; font-weight: 700; color: #3D2C23; margin: 20px 0 12px 0; line-height: 1.35; }\n");
        sb.append("  .body-content { font-size: 15px; line-height: 1.6; color: #6E5A4A; margin-bottom: 24px; }\n");
        sb.append("  .cta-button { display: inline-block; background-color: #3D2C23; color: #FFFDF9 !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; letter-spacing: 0.3px; }\n");
        sb.append("  .footer-text { font-size: 12px; color: #8C7A6B; text-align: center; margin-top: 24px; line-height: 1.5; }\n");
        sb.append("  @media only screen and (max-width: 600px) {\n");
        sb.append("    .email-card { padding: 24px 20px !important; border-radius: 12px !important; }\n");
        sb.append("    .email-container { width: 100% !important; }\n");
        sb.append("  }\n");
        sb.append("</style>\n");
        sb.append("</head>\n");
        sb.append("<body style=\"margin: 0; padding: 0; background-color: #F7EFE4;\">\n");
        if (preheader != null && !preheader.isBlank()) {
            sb.append("<div style=\"display:none;font-size:1px;color:#F7EFE4;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;\">")
              .append(escapeHtml(preheader))
              .append("</div>\n");
        }
        sb.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color: #F7EFE4; padding: 36px 16px;\">\n");
        sb.append("  <tr>\n");
        sb.append("    <td align=\"center\">\n");
        sb.append("      <table role=\"presentation\" class=\"email-container\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"max-width: 580px; width: 100%; margin: 0 auto;\">\n");
        sb.append("        <tr>\n");
        sb.append("          <td class=\"email-card\" style=\"background-color: #FFFDF9; border: 1px solid #E6D5C2; border-radius: 16px; padding: 36px 32px;\">\n");
        sb.append("            <div style=\"text-align: left;\">\n");
        sb.append("              <a href=\"https://10signal.me\" target=\"_blank\" style=\"text-decoration: none;\">\n");
        sb.append("                <span class=\"brand-logo\" style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 700; color: #3D2C23; letter-spacing: -0.5px;\">10Signal</span>\n");
        sb.append("              </a>\n");
        sb.append("            </div>\n");
        sb.append("            <h1 class=\"email-title\" style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 700; color: #3D2C23; margin: 20px 0 12px 0; line-height: 1.35;\">").append(title).append("</h1>\n");
        sb.append("            <div class=\"body-content\" style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #6E5A4A;\">").append(body).append("</div>\n");
        if (hasCta) {
            sb.append("            <div style=\"margin: 28px 0 8px 0; text-align: left;\">\n");
            sb.append("              <a href=\"").append(escapeHtml(ctaUrl)).append("\" class=\"cta-button\" target=\"_blank\" style=\"display: inline-block; background-color: #3D2C23; color: #FFFDF9 !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; letter-spacing: 0.3px;\">").append(ctaText).append("</a>\n");
            sb.append("            </div>\n");
        }
        sb.append("          </td>\n");
        sb.append("        </tr>\n");
        sb.append("        <tr>\n");
        sb.append("          <td align=\"center\" style=\"padding-top: 16px;\">\n");
        sb.append("            <p class=\"footer-text\" style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #8C7A6B; text-align: center; margin: 0; line-height: 1.5;\">").append(footer != null ? footer : "10Signal").append("</p>\n");
        sb.append("          </td>\n");
        sb.append("        </tr>\n");
        sb.append("      </table>\n");
        sb.append("    </td>\n");
        sb.append("  </tr>\n");
        sb.append("</table>\n");
        sb.append("</body>\n");
        sb.append("</html>");

        return sb.toString();
    }
}
