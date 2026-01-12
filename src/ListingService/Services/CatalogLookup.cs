using System.Net.Http.Json;
using ListingService.Entities;

namespace ListingService.Services;

public class CatalogLookup(HttpClient http) : ICatalogLookup
{
    private IReadOnlyDictionary<int, string>? _transmissions;
    private IReadOnlyDictionary<int, string>? _fuelTypes;
    private IReadOnlyDictionary<int, string>? _bodyTypes;

    public async Task PopulateSnapshotsAsync(Listing listing)
    {
        // Derivative details (includes names for body/trans/fuel)
        var derivative = await http.GetFromJsonAsync<DerivativeDto>($"derivatives/{listing.DerivativeId}");
        if (derivative is not null)
        {
            listing.DerivativeName = derivative.Name ?? string.Empty;
            listing.ModelId = derivative.ModelId;
            if (derivative.GenerationId.HasValue) listing.GenerationId = derivative.GenerationId.Value;
            if (listing.BodyTypeId == 0) listing.BodyTypeId = derivative.BodyTypeId;
            listing.SeatsSnapshot = derivative.Seats;
            listing.DoorsSnapshot = derivative.Doors;
            listing.EngineSnapshot = derivative.Engine;
            if (listing.TransmissionId is null) listing.TransmissionId = derivative.TransmissionId;
            if (listing.FuelTypeId is null) listing.FuelTypeId = derivative.FuelTypeId;
            listing.BatteryCapacityKWhSnapshot = derivative.BatteryCapacityKWh;
            if (string.IsNullOrWhiteSpace(listing.BodyTypeName)) listing.BodyTypeName = derivative.BodyType;
            if (string.IsNullOrWhiteSpace(listing.TransmissionName)) listing.TransmissionName = derivative.Transmission;
            if (string.IsNullOrWhiteSpace(listing.FuelTypeName)) listing.FuelTypeName = derivative.FuelType;
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
    
    public async Task<FeatureBasic?> GetFeatureAsync(int featureId)
    {
        var f = await http.GetFromJsonAsync<FeatureDto>($"features/{featureId}");
        return f is null ? null : new FeatureBasic(f.Id, f.Name, f.Description);
    }

    public async Task<string?> GetTransmissionNameAsync(int transmissionId)
    {
        await EnsureVariantOptionsAsync();
        return _transmissions != null && _transmissions.TryGetValue(transmissionId, out var name) ? name : null;
    }

    public async Task<string?> GetFuelTypeNameAsync(int fuelTypeId)
    {
        await EnsureVariantOptionsAsync();
        return _fuelTypes != null && _fuelTypes.TryGetValue(fuelTypeId, out var name) ? name : null;
    }

    public async Task<string?> GetBodyTypeNameAsync(int bodyTypeId)
    {
        await EnsureDerivativeOptionsAsync();
        return _bodyTypes != null && _bodyTypes.TryGetValue(bodyTypeId, out var name) ? name : null;
    }

    private async Task EnsureVariantOptionsAsync()
    {
        if (_transmissions != null && _fuelTypes != null) return;
        var opts = await http.GetFromJsonAsync<VariantOptionsDto>("variants/options");
        var transmissions = opts?.Transmissions ?? new List<OptionDto>();
        var fuelTypes = opts?.FuelTypes ?? new List<OptionDto>();
        _transmissions = transmissions.ToDictionary(o => o.Id, o => o.Name);
        _fuelTypes = fuelTypes.ToDictionary(o => o.Id, o => o.Name);
    }

    private async Task EnsureDerivativeOptionsAsync()
    {
        if (_bodyTypes != null) return;
        var bodies = await http.GetFromJsonAsync<List<OptionDto>>("derivatives/options");
        _bodyTypes = (bodies ?? new List<OptionDto>()).ToDictionary(o => o.Id, o => o.Name);
    }

    // Minimal internal DTOs matching CatalogService outputs
    private record MakeDto(int Id, string Name);
    private record ModelDto(int Id, string Name, int MakeId);
    private record GenerationDto(int Id, string Name, short? StartYear, short? EndYear, int ModelId);
    private record VariantDto(int Id, string Name, int DerivativeId);
    private record DerivativeDto(int Id, string? Name, int ModelId, int? GenerationId, int BodyTypeId, string? BodyType, short Seats, short Doors, string? Engine, int? TransmissionId, string? Transmission, int? FuelTypeId, string? FuelType, decimal? BatteryCapacityKWh);
    private record VariantFeatureDto(int VariantId, int FeatureId, bool IsStandard, DateTime AddedDate);
    private record FeatureDto(int Id, string Name, string? Description);
    private record OptionDto(int Id, string Name);
    private record VariantOptionsDto(List<OptionDto> Transmissions, List<OptionDto> FuelTypes);
    
}
