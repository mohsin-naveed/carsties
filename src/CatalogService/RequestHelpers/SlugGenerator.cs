using System.Security.Cryptography;
using System.Text;

namespace CatalogService.RequestHelpers;

public static class SlugGenerator
{
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

    // Generate a table-prefixed slug like "mk-1a2b3c". Lowercase, hyphen-separated, ASCII only.
    public static string Generate(string prefix, int randomLen = 6)
    {
        var p = (prefix ?? string.Empty).Trim().ToLowerInvariant();
        if (p == string.Empty) return RandomAlphaNum(randomLen);
        return $"{p}-{RandomAlphaNum(randomLen)}";
    }
}
