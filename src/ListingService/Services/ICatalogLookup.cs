using ListingService.Entities;
using System.Threading.Tasks;

namespace ListingService.Services;

public interface ICatalogLookup
{
    Task<List<VariantFeatureSnapshot>> GetVariantFeaturesAsync(int variantId);
    Task<FeatureBasic?> GetFeatureAsync(int featureId);
}

public record VariantFeatureSnapshot(int VariantId, int FeatureId, bool IsStandard);
public record FeatureBasic(int Id, string Name, string? Description);
