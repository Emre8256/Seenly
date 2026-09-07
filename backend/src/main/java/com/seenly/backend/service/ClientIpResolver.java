package com.seenly.backend.service;

import com.seenly.backend.config.SecurityProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class ClientIpResolver {
    private final List<CidrRange> trustedProxies;

    public ClientIpResolver(SecurityProperties properties) {
        this.trustedProxies = properties.getTrustedProxyCidrs().stream()
            .filter(value -> value != null && !value.isBlank())
            .map(CidrRange::parse)
            .toList();
    }

    public String resolve(HttpServletRequest request) {
        String peer = parseLiteral(request.getRemoteAddr());
        if (peer == null || !isTrusted(peer)) return safePeer(request.getRemoteAddr());

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded == null || forwarded.isBlank()) return peer;
        List<String> hops = new ArrayList<>();
        for (String value : forwarded.split(",")) {
            String parsed = parseLiteral(value.trim());
            if (parsed == null) return peer;
            hops.add(parsed);
        }
        String effective = peer;
        for (int i = hops.size() - 1; i >= 0 && isTrusted(effective); i--) {
            effective = hops.get(i);
        }
        return effective;
    }

    public boolean isSecure(HttpServletRequest request) {
        if (request.isSecure()) return true;
        String peer = parseLiteral(request.getRemoteAddr());
        return peer != null && isTrusted(peer)
            && "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
    }

    private boolean isTrusted(String address) {
        return trustedProxies.stream().anyMatch(range -> range.contains(address));
    }

    private String safePeer(String value) {
        String parsed = parseLiteral(value);
        return parsed == null ? "unknown" : parsed;
    }

    private String parseLiteral(String value) {
        if (value == null || value.isBlank() || !value.matches("[0-9A-Fa-f:.]+")) return null;
        String candidate = value;
        if (candidate.startsWith("[") && candidate.endsWith("]")) {
            candidate = candidate.substring(1, candidate.length() - 1);
        }
        try {
            return InetAddress.getByName(candidate).getHostAddress();
        } catch (UnknownHostException ex) {
            return null;
        }
    }

    private record CidrRange(byte[] network, int prefixLength) {
        static CidrRange parse(String value) {
            String[] parts = value.trim().split("/", 2);
            String literal = parts[0];
            if (!literal.matches("[0-9A-Fa-f:.]+")) {
                throw new IllegalArgumentException("Trusted proxy ranges must use literal IP CIDR notation.");
            }
            try {
                byte[] address = InetAddress.getByName(literal).getAddress();
                int bits = address.length * 8;
                int prefix = parts.length == 2 ? Integer.parseInt(parts[1]) : bits;
                if (prefix < 0 || prefix > bits) throw new IllegalArgumentException("Invalid trusted proxy CIDR.");
                return new CidrRange(mask(address, prefix), prefix);
            } catch (UnknownHostException | NumberFormatException ex) {
                throw new IllegalArgumentException("Invalid trusted proxy CIDR: " + value, ex);
            }
        }

        boolean contains(String value) {
            try {
                byte[] address = InetAddress.getByName(value).getAddress();
                return address.length == network.length && Arrays.equals(mask(address, prefixLength), network);
            } catch (UnknownHostException ex) {
                return false;
            }
        }

        private static byte[] mask(byte[] address, int prefix) {
            byte[] masked = address.clone();
            for (int bit = prefix; bit < masked.length * 8; bit++) {
                masked[bit / 8] &= (byte) ~(1 << (7 - (bit % 8)));
            }
            return masked;
        }
    }
}
