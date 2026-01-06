using ListingService.Entities;
using System.Threading.Tasks;

namespace ListingService.Services;

public interface ICatalogLookup
{
    Task PopulateSnapshotsAsync(Listing listing);
    Task<List<VariantFeatureSnapshot>> GetVariantFeaturesAsync(int variantId);
}

public record VariantFeatureSnapshot(int VariantId, int FeatureId, bool IsStandard);
