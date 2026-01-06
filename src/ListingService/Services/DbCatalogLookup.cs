using ListingService.Data;
using ListingService.Entities;
using Microsoft.EntityFrameworkCore;

namespace ListingService.Services;

public class DbCatalogLookup(ListingDbContext db) : ICatalogLookup
{
    public async Task PopulateSnapshotsAsync(Listing listing)
    {
        var make = await db.Makes.FirstOrDefaultAsync(x => x.Id == listing.MakeId);
        var model = await db.Models.FirstOrDefaultAsync(x => x.Id == listing.ModelId);
        var generation = await db.Generations.FirstOrDefaultAsync(x => x.Id == listing.GenerationId);
        var derivative = await db.Derivatives.FirstOrDefaultAsync(x => x.Id == listing.DerivativeId);
        var variant = await db.Variants.FirstOrDefaultAsync(x => x.Id == listing.VariantId);
        var bodyType = await db.BodyTypes.FirstOrDefaultAsync(x => x.Id == listing.BodyTypeId);
        var trans = listing.TransmissionId.HasValue ? await db.Transmissions.FirstOrDefaultAsync(x => x.Id == listing.TransmissionId.Value) : null;
        var fuel = listing.FuelTypeId.HasValue ? await db.FuelTypes.FirstOrDefaultAsync(x => x.Id == listing.FuelTypeId.Value) : null;

        listing.MakeName = make?.Name;
        listing.ModelName = model?.Name;
        listing.GenerationName = generation?.Name;
        listing.DerivativeName = derivative?.Name;
        listing.VariantName = variant?.Name;
        listing.BodyTypeName = bodyType?.Name;
        listing.TransmissionName = trans?.Name;
        listing.FuelTypeName = fuel?.Name;

        listing.SeatsSnapshot = derivative?.Seats;
        listing.DoorsSnapshot = derivative?.Doors;
        listing.EngineSnapshot = derivative?.Engine;
        listing.BatteryCapacityKWhSnapshot = derivative?.BatteryCapacityKWh;
    }

    public Task<List<VariantFeatureSnapshot>> GetVariantFeaturesAsync(int variantId)
    {
        // Local DB does not track variant->feature mapping; return empty as a safe fallback
        return Task.FromResult(new List<VariantFeatureSnapshot>());
    }
}
