using LocationService.Data;
using Microsoft.EntityFrameworkCore;

namespace LocationService.RequestHelpers;

public static class CodeGenerator
{
    private static async Task<string> NextCodeAsync(IQueryable<string> codeQuery, string prefix, int width = 4)
    {
        var list = await codeQuery.ToListAsync();
        var max = 0;
        foreach (var c in list)
        {
            if (string.IsNullOrWhiteSpace(c)) continue;
            var up = c.ToUpperInvariant();
            var p = prefix.ToUpperInvariant() + "-";
            if (!up.StartsWith(p)) continue;
            var numPart = up.Substring(p.Length);
            if (int.TryParse(numPart, out var n) && n > max) max = n;
        }
        var next = max + 1;
        var candidate = $"{prefix.ToUpperInvariant()}-{next.ToString(new string('0', width))}";
        while (list.Any(x => string.Equals(x, candidate, StringComparison.OrdinalIgnoreCase)))
        {
            next++;
            candidate = $"{prefix.ToUpperInvariant()}-{next.ToString(new string('0', width))}";
        }
        return candidate;
    }

    public static Task<string> NextProvinceCodeAsync(LocationDbContext ctx) => NextCodeAsync(ctx.Provinces.Select(p => p.Code), "PR", 4);
    public static Task<string> NextCityCodeAsync(LocationDbContext ctx) => NextCodeAsync(ctx.Cities.Select(c => c.Code), "CT", 4);
    public static Task<string> NextAreaCodeAsync(LocationDbContext ctx) => NextCodeAsync(ctx.Areas.Select(a => a.Code), "AR", 4);
}
