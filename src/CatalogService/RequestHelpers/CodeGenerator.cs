using System.Text.RegularExpressions;
using CatalogService.Data;
using CatalogService.Entities;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.RequestHelpers;

public static class CodeGenerator
{
    private static async Task<string> NextCodeAsync(IQueryable<string> codeQuery, string prefix, int width = 3)
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

    public static Task<string> NextMakeCodeAsync(CatalogDbContext ctx) => NextCodeAsync(ctx.Makes.Select(m => m.Code), "MK");
    public static Task<string> NextModelCodeAsync(CatalogDbContext ctx) => NextCodeAsync(ctx.Models.Select(m => m.Code), "MD");
    public static Task<string> NextGenerationCodeAsync(CatalogDbContext ctx) => NextCodeAsync(ctx.Generations.Select(g => g.Code), "GN");
    public static Task<string> NextDerivativeCodeAsync(CatalogDbContext ctx) => NextCodeAsync(ctx.Derivatives.Select(d => d.Code), "DR", 3);
    public static Task<string> NextVariantCodeAsync(CatalogDbContext ctx) => NextCodeAsync(ctx.Variants.Select(v => v.Code), "VR", 3);
    public static Task<string> NextBodyTypeCodeAsync(CatalogDbContext ctx) => NextCodeAsync(ctx.BodyTypes.Select(b => b.Code), "BT");
    public static Task<string> NextDriveTypeCodeAsync(CatalogDbContext ctx) => NextCodeAsync(ctx.DriveTypes.Select(d => d.Code), "DT");
    public static Task<string> NextFuelTypeCodeAsync(CatalogDbContext ctx) => NextCodeAsync(ctx.FuelTypes.Select(f => f.Code), "FT");
    public static Task<string> NextTransmissionCodeAsync(CatalogDbContext ctx) => NextCodeAsync(ctx.Transmissions.Select(t => t.Code), "TR");
    public static Task<string> NextFeatureCodeAsync(CatalogDbContext ctx) => NextCodeAsync(ctx.Features.Select(f => f.Code), "FR");

    public static async Task<bool> IsCodeUniqueAsync(CatalogDbContext ctx, string table, string code, int? excludeId = null)
    {
        code = code.ToUpperInvariant();
        return table switch
        {
            "Makes" => !await ctx.Makes.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            "Models" => !await ctx.Models.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            "Derivatives" => !await ctx.Derivatives.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            "Variants" => !await ctx.Variants.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            "Generations" => !await ctx.Generations.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            "BodyTypes" => !await ctx.BodyTypes.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            "DriveTypes" => !await ctx.DriveTypes.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            "FuelTypes" => !await ctx.FuelTypes.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            "Transmissions" => !await ctx.Transmissions.AnyAsync(x => x.Code == code && (excludeId == null || x.Id != excludeId.Value)),
            _ => true
        };
    }
}
