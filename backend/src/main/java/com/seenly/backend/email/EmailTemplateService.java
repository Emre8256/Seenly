package com.seenly.backend.email;

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
            return supportedLocales.contains("tr") ? "tr" : CANONICAL_FALLBACK_LOCALE;
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
        return supportedLocales.contains(CANONICAL_FALLBACK_LOCALE) ? CANONICAL_FALLBACK_LOCALE : "tr";
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
        String ctaText = replaceVariables(template.getCtaText(), safeContext, true);
        String ctaUrl = replaceVariables(template.getCtaUrl(), safeContext, false);
        String footer = replaceVariables(template.getFooter(), safeContext, true);

        String htmlBody = buildHtmlLayout(safeSubject, preheader, title, body, ctaText, ctaUrl, footer);
        String textBody = replaceVariables(template.getPlainText(), safeContext, false);

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
                                   String ctaText, String ctaUrl, String footer) {
        boolean hasCta = ctaText != null && !ctaText.isBlank() && ctaUrl != null && !ctaUrl.isBlank();

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>\n");
        sb.append("<html lang=\"en\" xmlns=\"http://www.w3.org/1999/xhtml\">\n");
        sb.append("<head>\n");
        sb.append("<meta charset=\"UTF-8\">\n");
        sb.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n");
        sb.append("<title>").append(escapeHtml(subject)).append("</title>\n");
        sb.append("<style>\n");
        sb.append("  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; }\n");
        sb.append("  table { border-collapse: collapse; }\n");
        sb.append("  .container { max-width: 580px; margin: 0 auto; width: 100%; }\n");
        sb.append("  .card { background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 36px 32px; }\n");
        sb.append("  .logo { font-size: 20px; font-weight: 700; color: #8b5cf6; text-decoration: none; letter-spacing: -0.5px; }\n");
        sb.append("  .title { font-size: 22px; font-weight: 600; color: #ffffff; margin-top: 24px; margin-bottom: 12px; line-height: 1.3; }\n");
        sb.append("  .body-text { font-size: 15px; line-height: 1.6; color: #9ca3af; margin-bottom: 28px; }\n");
        sb.append("  .cta-btn { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 600; font-size: 14px; text-align: center; }\n");
        sb.append("  .footer-text { font-size: 12px; color: #4b5563; text-align: center; margin-top: 24px; line-height: 1.5; }\n");
        sb.append("  @media only screen and (max-width: 600px) {\n");
        sb.append("    .card { padding: 24px 20px !important; border-radius: 12px !important; }\n");
        sb.append("  }\n");
        sb.append("</style>\n");
        sb.append("</head>\n");
        sb.append("<body>\n");
        if (preheader != null && !preheader.isBlank()) {
            sb.append("<div style=\"display:none;font-size:1px;color:#0b0f19;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;\">")
              .append(preheader)
              .append("</div>\n");
        }
        sb.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#0b0f19; padding: 32px 16px;\">\n");
        sb.append("  <tr>\n");
        sb.append("    <td align=\"center\">\n");
        sb.append("      <table role=\"presentation\" class=\"container\" cellpadding=\"0\" cellspacing=\"0\">\n");
        sb.append("        <tr>\n");
        sb.append("          <td class=\"card\">\n");
        sb.append("            <div style=\"text-align: left;\"><span class=\"logo\">Seenly</span></div>\n");
        sb.append("            <h1 class=\"title\">").append(title).append("</h1>\n");
        sb.append("            <div class=\"body-text\">").append(body).append("</div>\n");
        if (hasCta) {
            sb.append("            <div style=\"margin: 28px 0;\"><a href=\"").append(escapeHtml(ctaUrl))
              .append("\" class=\"cta-btn\" target=\"_blank\">").append(ctaText).append("</a></div>\n");
        }
        sb.append("          </td>\n");
        sb.append("        </tr>\n");
        sb.append("        <tr>\n");
        sb.append("          <td>\n");
        sb.append("            <p class=\"footer-text\">").append(footer != null ? footer : "Seenly").append("</p>\n");
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
