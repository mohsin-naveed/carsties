using ListingService.Entities;
using System.Threading.Tasks;

namespace ListingService.Services;

public interface ICatalogLookup
{
    Task PopulateSnapshotsAsync(Listing listing);
    Task<List<VariantFeatureSnapshot>> GetVariantFeaturesAsync(int variantId);
    Task<FeatureBasic?> GetFeatureAsync(int featureId);
    Task<string?> GetTransmissionNameAsync(int transmissionId);
    Task<string?> GetFuelTypeNameAsync(int fuelTypeId);
    Task<string?> GetBodyTypeNameAsync(int bodyTypeId);
}

public record VariantFeatureSnapshot(int VariantId, int FeatureId, bool IsStandard);
public record FeatureBasic(int Id, string Name, string? Description);
