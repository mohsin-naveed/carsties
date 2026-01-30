using System.Security.Cryptography;
using System.Text;

namespace LocationService.RequestHelpers;

public static class SlugGenerator
{
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
        if (string.IsNullOrEmpty(result)) result = RandomAlphaNum(6);
        return result;
    }

    public static string Generate(string prefix, int randomLen = 6)
    {
        var p = (prefix ?? string.Empty).Trim().ToLowerInvariant();
        if (p == string.Empty) return RandomAlphaNum(randomLen);
        return $"{p}-{RandomAlphaNum(randomLen)}";
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
}
