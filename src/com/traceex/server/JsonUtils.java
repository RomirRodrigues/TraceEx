package com.traceex.server;

import java.util.*;

/**
 * Lightweight, zero-dependency JSON parser and serializer for TraceEx.
 */
public class JsonUtils {

    // ==================== SERIALIZATION ====================

    public static String toJson(Object obj) {
        StringBuilder sb = new StringBuilder();
        serialize(obj, sb);
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static void serialize(Object obj, StringBuilder sb) {
        if (obj == null) {
            sb.append("null");
        } else if (obj instanceof String) {
            sb.append("\"").append(escapeString((String) obj)).append("\"");
        } else if (obj instanceof Number || obj instanceof Boolean) {
            sb.append(obj.toString());
        } else if (obj instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) obj;
            sb.append("{");
            boolean first = true;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (!first) sb.append(",");
                first = false;
                sb.append("\"").append(escapeString(String.valueOf(entry.getKey()))).append("\":");
                serialize(entry.getValue(), sb);
            }
            sb.append("}");
        } else if (obj instanceof Iterable) {
            Iterable<?> list = (Iterable<?>) obj;
            sb.append("[");
            boolean first = true;
            for (Object item : list) {
                if (!first) sb.append(",");
                first = false;
                serialize(item, sb);
            }
            sb.append("]");
        } else if (obj.getClass().isArray()) {
            Object[] arr = (Object[]) obj;
            sb.append("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                serialize(arr[i], sb);
            }
            sb.append("]");
        } else {
            sb.append("\"").append(escapeString(obj.toString())).append("\"");
        }
    }

    private static String escapeString(String s) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 32) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                    break;
            }
        }
        return sb.toString();
    }

    // ==================== PARSING ====================

    public static Object parse(String json) {
        if (json == null) return null;
        json = json.trim();
        if (json.isEmpty()) return null;
        Parser parser = new Parser(json);
        return parser.parseValue();
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> parseObject(String json) {
        Object val = parse(json);
        if (val instanceof Map) {
            return (Map<String, Object>) val;
        }
        return new LinkedHashMap<>();
    }

    @SuppressWarnings("unchecked")
    public static List<Object> parseList(String json) {
        Object val = parse(json);
        if (val instanceof List) {
            return (List<Object>) val;
        }
        return new ArrayList<>();
    }

    public static String getString(Map<String, Object> map, String key, String def) {
        Object o = map.get(key);
        return o == null ? def : o.toString();
    }

    public static double getDouble(Map<String, Object> map, String key, double def) {
        Object o = map.get(key);
        if (o instanceof Number) {
            return ((Number) o).doubleValue();
        }
        if (o instanceof String) {
            try {
                return Double.parseDouble((String) o);
            } catch (Exception ignored) {}
        }
        return def;
    }

    public static boolean getBoolean(Map<String, Object> map, String key, boolean def) {
        Object o = map.get(key);
        if (o instanceof Boolean) {
            return (Boolean) o;
        }
        if (o instanceof String) {
            return Boolean.parseBoolean((String) o);
        }
        return def;
    }

    private static class Parser {
        private final String src;
        private int pos = 0;
        private final int len;

        Parser(String src) {
            this.src = src;
            this.len = src.length();
        }

        private void skipWhitespace() {
            while (pos < len && Character.isWhitespace(src.charAt(pos))) {
                pos++;
            }
        }

        private char peek() {
            skipWhitespace();
            if (pos >= len) return '\0';
            return src.charAt(pos);
        }

        Object parseValue() {
            skipWhitespace();
            if (pos >= len) return null;
            char c = src.charAt(pos);
            if (c == '{') return parseObject();
            if (c == '[') return parseArray();
            if (c == '"') return parseString();
            if (c == 't' || c == 'f') return parseBoolean();
            if (c == 'n') return parseNull();
            if (c == '-' || Character.isDigit(c)) return parseNumber();
            throw new IllegalArgumentException("Unexpected character at " + pos + ": " + c);
        }

        private Map<String, Object> parseObject() {
            Map<String, Object> map = new LinkedHashMap<>();
            pos++; // consume '{'
            skipWhitespace();
            if (peek() == '}') {
                pos++;
                return map;
            }
            while (pos < len) {
                skipWhitespace();
                if (peek() != '"') {
                    throw new IllegalArgumentException("Expected string key at pos " + pos);
                }
                String key = parseString();
                skipWhitespace();
                if (pos >= len || src.charAt(pos) != ':') {
                    throw new IllegalArgumentException("Expected ':' after key at pos " + pos);
                }
                pos++; // consume ':'
                Object value = parseValue();
                map.put(key, value);
                skipWhitespace();
                char next = peek();
                if (next == '}') {
                    pos++;
                    return map;
                } else if (next == ',') {
                    pos++;
                } else {
                    throw new IllegalArgumentException("Expected ',' or '}' at pos " + pos);
                }
            }
            return map;
        }

        private List<Object> parseArray() {
            List<Object> list = new ArrayList<>();
            pos++; // consume '['
            skipWhitespace();
            if (peek() == ']') {
                pos++;
                return list;
            }
            while (pos < len) {
                Object val = parseValue();
                list.add(val);
                skipWhitespace();
                char next = peek();
                if (next == ']') {
                    pos++;
                    return list;
                } else if (next == ',') {
                    pos++;
                } else {
                    throw new IllegalArgumentException("Expected ',' or ']' at pos " + pos);
                }
            }
            return list;
        }

        private String parseString() {
            pos++; // consume initial '"'
            StringBuilder sb = new StringBuilder();
            while (pos < len) {
                char c = src.charAt(pos++);
                if (c == '"') {
                    return sb.toString();
                }
                if (c == '\\') {
                    if (pos >= len) break;
                    char esc = src.charAt(pos++);
                    switch (esc) {
                        case '"': sb.append('"'); break;
                        case '\\': sb.append('\\'); break;
                        case '/': sb.append('/'); break;
                        case 'b': sb.append('\b'); break;
                        case 'f': sb.append('\f'); break;
                        case 'n': sb.append('\n'); break;
                        case 'r': sb.append('\r'); break;
                        case 't': sb.append('\t'); break;
                        case 'u':
                            if (pos + 4 <= len) {
                                String hex = src.substring(pos, pos + 4);
                                pos += 4;
                                try {
                                    sb.append((char) Integer.parseInt(hex, 16));
                                } catch (NumberFormatException e) {
                                    sb.append("?");
                                }
                            }
                            break;
                        default:
                            sb.append(esc);
                            break;
                    }
                } else {
                    sb.append(c);
                }
            }
            return sb.toString();
        }

        private Boolean parseBoolean() {
            if (src.startsWith("true", pos)) {
                pos += 4;
                return Boolean.TRUE;
            } else if (src.startsWith("false", pos)) {
                pos += 5;
                return Boolean.FALSE;
            }
            throw new IllegalArgumentException("Invalid boolean literal at pos " + pos);
        }

        private Object parseNull() {
            if (src.startsWith("null", pos)) {
                pos += 4;
                return null;
            }
            throw new IllegalArgumentException("Invalid null literal at pos " + pos);
        }

        private Number parseNumber() {
            int start = pos;
            if (src.charAt(pos) == '-') pos++;
            while (pos < len && Character.isDigit(src.charAt(pos))) {
                pos++;
            }
            boolean isFloat = false;
            if (pos < len && src.charAt(pos) == '.') {
                isFloat = true;
                pos++;
                while (pos < len && Character.isDigit(src.charAt(pos))) {
                    pos++;
                }
            }
            if (pos < len && (src.charAt(pos) == 'e' || src.charAt(pos) == 'E')) {
                isFloat = true;
                pos++;
                if (pos < len && (src.charAt(pos) == '+' || src.charAt(pos) == '-')) {
                    pos++;
                }
                while (pos < len && Character.isDigit(src.charAt(pos))) {
                    pos++;
                }
            }
            String numStr = src.substring(start, pos);
            if (isFloat) {
                return Double.parseDouble(numStr);
            } else {
                try {
                    return Long.parseLong(numStr);
                } catch (NumberFormatException e) {
                    return Double.parseDouble(numStr);
                }
            }
        }
    }
}
