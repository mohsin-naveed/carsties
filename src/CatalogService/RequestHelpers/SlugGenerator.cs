using System.Security.Cryptography;
using System.Text;

namespace CatalogService.RequestHelpers;

public static class SlugGenerator
{
    // Convert a display name to a lowercase, ASCII-only, hyphen-separated slug.
    public static string FromName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return string.Empty;
        var normalized = name.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);
        foreach (var ch in normalized)
        {
            var uc = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch);
            if (uc != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                sb.Append(ch);
            }
        }
        var ascii = sb.ToString().Normalize(NormalizationForm.FormC);
        var lower = ascii.ToLowerInvariant();
        var cleaned = new StringBuilder(lower.Length);
        bool lastWasHyphen = false;
        foreach (var c in lower)
        {
            if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9'))
            {
                cleaned.Append(c);
                lastWasHyphen = false;
            }
            else
            {
                if (!lastWasHyphen)
                {
                    cleaned.Append('-');
                    lastWasHyphen = true;
                }
            }
        }
        var result = cleaned.ToString().Trim('-');
        // Ensure non-empty result; fallback to random slug without business meaning
        if (string.IsNullOrEmpty(result)) result = RandomAlphaNum(6);
        return result;
    }

    private static string RandomAlphaNum(int len)
    {
        const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        var sb = new StringBuilder(len);
        using var rng = RandomNumberGenerator.Create();
        var buffer = new byte[len];
        rng.GetBytes(buffer);
        for (int i = 0; i < len; i++) sb.Append(chars[buffer[i] % chars.Length]);
        return sb.ToString();
    }

    // Generate a table-prefixed slug like "mk-1a2b3c" if needed
    public static string Generate(string prefix, int randomLen = 6)
    {
        var p = (prefix ?? string.Empty).Trim().ToLowerInvariant();
        if (p == string.Empty) return RandomAlphaNum(randomLen);
        return $"{p}-{RandomAlphaNum(randomLen)}";
    }
}
