using System.Net.Http.Json;
using ListingService.Entities;

namespace ListingService.Services;

public class CatalogLookup(HttpClient http) : ICatalogLookup
{
    public async Task PopulateSnapshotsAsync(Listing listing)
    {
        // Derivative details (includes names for body/trans/fuel)
        var derivative = await http.GetFromJsonAsync<DerivativeDto>($"derivatives/{listing.DerivativeId}");
        if (derivative is not null)
        {
            listing.DerivativeName = derivative.Name ?? string.Empty;
            listing.ModelId = derivative.ModelId;
            if (derivative.GenerationId.HasValue) listing.GenerationId = derivative.GenerationId.Value;
            listing.BodyTypeId = derivative.BodyTypeId;
            listing.SeatsSnapshot = derivative.Seats;
            listing.DoorsSnapshot = derivative.Doors;
            listing.EngineSnapshot = derivative.Engine;
            listing.TransmissionId = derivative.TransmissionId;
            listing.FuelTypeId = derivative.FuelTypeId;
            listing.BatteryCapacityKWhSnapshot = derivative.BatteryCapacityKWh;
            listing.BodyTypeName = derivative.BodyType;
            listing.TransmissionName = derivative.Transmission;
            listing.FuelTypeName = derivative.FuelType;
        }

        // Model and Make
        var model = await http.GetFromJsonAsync<ModelDto>($"models/{listing.ModelId}");
        if (model is not null)
        {
            listing.ModelName = model.Name;
            listing.MakeId = model.MakeId;
        }
        var make = await http.GetFromJsonAsync<MakeDto>($"makes/{listing.MakeId}");
        if (make is not null) listing.MakeName = make.Name;

        // Generation
        var gen = await http.GetFromJsonAsync<GenerationDto>($"generations/{listing.GenerationId}");
        if (gen is not null) listing.GenerationName = gen.Name;

        // Variant
        var variant = await http.GetFromJsonAsync<VariantDto>($"variants/{listing.VariantId}");
        if (variant is not null) listing.VariantName = variant.Name;
    }

    public async Task<List<VariantFeatureSnapshot>> GetVariantFeaturesAsync(int variantId)
    {
        var list = await http.GetFromJsonAsync<List<VariantFeatureDto>>($"variantfeatures?variantId={variantId}")
                   ?? new List<VariantFeatureDto>();
        return list.Select(x => new VariantFeatureSnapshot(x.VariantId, x.FeatureId, x.IsStandard)).ToList();
    }

    // Minimal internal DTOs matching CatalogService outputs
    private record MakeDto(int Id, string Name);
    private record ModelDto(int Id, string Name, int MakeId);
    private record GenerationDto(int Id, string Name, short? StartYear, short? EndYear, int ModelId);
    private record VariantDto(int Id, string Name, int DerivativeId);
    private record DerivativeDto(int Id, string? Name, int ModelId, int? GenerationId, int BodyTypeId, string? BodyType, short Seats, short Doors, string? Engine, int? TransmissionId, string? Transmission, int? FuelTypeId, string? FuelType, decimal? BatteryCapacityKWh);
    private record VariantFeatureDto(int VariantId, int FeatureId, bool IsStandard, DateTime AddedDate);
}
