using System.Text.RegularExpressions;
using CatalogService.Data;
using CatalogService.Entities;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.RequestHelpers;

public static class CodeGenerator
{
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

    public static string MakeCode(string name) => Normalize(name);
    public static string ModelCode(string name) => Normalize(name);

    public static string DerivativeCode(string makeCode, string modelCode, string generationName, string bodyTypeName, string? transmissionName)
    {
        var tokens = new List<string>
        {
            Normalize(makeCode, dashes: true),
            Normalize(modelCode, dashes: true),
            Normalize(generationName, dashes: true),
            Normalize(bodyTypeName, dashes: true)
        };
        if (!string.IsNullOrWhiteSpace(transmissionName)) tokens.Add(Normalize(transmissionName!, dashes: true));
        return string.Join('-', tokens);
    }

    public static string VariantCode(string derivativeCode, string variantName)
    {
        return Normalize(derivativeCode, dashes: true) + "-" + Normalize(variantName, dashes: true);
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
