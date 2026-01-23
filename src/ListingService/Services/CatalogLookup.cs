using System.Net.Http.Json;
using ListingService.Entities;

namespace ListingService.Services;

public class CatalogLookup(HttpClient http) : ICatalogLookup
{

    public async Task<List<VariantFeatureSnapshot>> GetVariantFeaturesAsync(int variantId)
    {
        var list = await http.GetFromJsonAsync<List<VariantFeatureDto>>($"variantfeatures?variantId={variantId}")
                   ?? new List<VariantFeatureDto>();
        return list.Select(x => new VariantFeatureSnapshot(x.VariantId, x.FeatureId, x.IsStandard)).ToList();
    }
    
    public async Task<FeatureBasic?> GetFeatureAsync(int featureId)
    {
        var f = await http.GetFromJsonAsync<FeatureDto>($"features/{featureId}");
        return f is null ? null : new FeatureBasic(f.Id, f.Name, f.Description);
    }

    // Note: Name lookups and options caching are no longer required here.

    // Minimal internal DTOs matching CatalogService outputs
    // Minimal internal DTOs matching CatalogService outputs
    private record VariantFeatureDto(int VariantId, int FeatureId, bool IsStandard, DateTime AddedDate);
    private record FeatureDto(int Id, string Name, string? Description);
    private record OptionDto(int Id, string Name, string? Code);
    
}
