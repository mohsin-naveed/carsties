using System.Text.RegularExpressions;
using CatalogService.Data;
using CatalogService.Entities;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.RequestHelpers;

public static class CodeGenerator
{
    private static string ShortSlug(string input, int maxLen = 4)
    {
        var upper = Normalize(input);
        if (string.IsNullOrEmpty(upper)) return "XXX";
        return upper.Length <= maxLen ? upper : upper.Substring(0, maxLen);
    }

    private static string Prefixed(string prefix, string name)
    {
        return prefix + "-" + ShortSlug(name);
    }
    private static string Normalize(string input, bool dashes = false)
    {
        var upper = (input ?? string.Empty).Trim().ToUpperInvariant();
        if (dashes)
        {
            upper = Regex.Replace(upper, @"\s+", "-");
            upper = Regex.Replace(upper, @"[^A-Z0-9-]", "");
            upper = Regex.Replace(upper, @"-+", "-");
        }
        else
        {
            upper = Regex.Replace(upper, @"\s+", "");
            upper = Regex.Replace(upper, @"[^A-Z0-9]", "");
        }
        return upper;
    }

    public static string MakeCode(string name) => Prefixed("MK", name);
    public static string ModelCode(string name) => Prefixed("MD", name);
    // Legacy FE- short code generator (kept for backward compat, not used for new features)
    public static string FeatureCode(string name) => Prefixed("FE", name);

    public static async Task<string> NextFeatureCodeAsync(CatalogDbContext ctx)
    {
        // Find the highest FR-### code and increment, else start at FR-001
        var max = 0;
        var list = await ctx.Features.Select(f => f.Code).ToListAsync();
        foreach (var c in list)
        {
            if (string.IsNullOrWhiteSpace(c)) continue;
            if (c.StartsWith("FR-", StringComparison.OrdinalIgnoreCase))
            {
                var numPart = c.Substring(3);
                if (int.TryParse(numPart, out var n) && n > max) max = n;
            }
        }
        var next = max + 1;
        var candidate = $"FR-{next:000}";
        while (list.Any(x => string.Equals(x, candidate, StringComparison.OrdinalIgnoreCase)))
        {
            next++;
            candidate = $"FR-{next:000}";
        }
        return candidate;
    }
    public static string TransmissionCode(string name) => Prefixed("TR", name);
    public static string BodyTypeCode(string name) => Prefixed("BT", name);

    // New code rules per spec: DR-{MakeCode}-{ModelCode}-{0001}
    public static async Task<string> NextDerivativeCodeAsync(CatalogDbContext ctx, int modelId)
    {
        var model = await ctx.Models.FirstAsync(m => m.Id == modelId);
        var make = await ctx.Makes.FirstAsync(mk => mk.Id == model.MakeId);
        var baseCode = $"DR-{make.Code}-{model.Code}";
        var count = await ctx.Derivatives.CountAsync(d => d.ModelId == modelId);
        var seq = (count + 1).ToString("0000");
        return $"{baseCode}-{seq}";
    }

    // Variant code: VR-{MakeCode}-{ModelCode}-{0001} per derivative
    public static async Task<string> NextVariantCodeAsync(CatalogDbContext ctx, int derivativeId)
    {
        var d = await ctx.Derivatives.FirstAsync(x => x.Id == derivativeId);
        var model = await ctx.Models.FirstAsync(m => m.Id == d.ModelId);
        var make = await ctx.Makes.FirstAsync(mk => mk.Id == model.MakeId);
        var baseCode = $"VR-{make.Code}-{model.Code}";
        var count = await ctx.Variants.CountAsync(v => v.DerivativeId == derivativeId);
        var seq = (count + 1).ToString("0000");
        return $"{baseCode}-{seq}";
    }

    public static async Task<bool> IsCodeUniqueAsync(CatalogDbContext ctx, string table, string code, int? excludeId = null)
    {
        code = code.ToUpperInvariant();
        return table switch
        {
            "Makes" => !await ctx.Makes.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            "Models" => !await ctx.Models.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            "Derivatives" => !await ctx.Derivatives.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            "Variants" => !await ctx.Variants.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            _ => true
        };
    }
}
