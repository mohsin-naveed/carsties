namespace ListingService.Entities;

public class Listing {
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int Year { get; set; }
    public int Mileage { get; set; }
    public decimal Price { get; set; }
    public string? Color { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int MakeId { get; set; }
    public int ModelId { get; set; }
    public int GenerationId { get; set; }
    public int DerivativeId { get; set; }
    public int VariantId { get; set; }
    public int? TransmissionId { get; set; }
    public int? FuelTypeId { get; set; }
    public int BodyTypeId { get; set; }

    // Snapshot fields to decouple from CatalogService
    public string? MakeName { get; set; }
    public string? ModelName { get; set; }
    public string? GenerationName { get; set; }
    public string? DerivativeName { get; set; }
    public string? VariantName { get; set; }
    public string? BodyTypeName { get; set; }
    public string? TransmissionName { get; set; }
    public string? FuelTypeName { get; set; }
    public short? SeatsSnapshot { get; set; }
    public short? DoorsSnapshot { get; set; }
    public string? EngineSnapshot { get; set; }
    public decimal? BatteryCapacityKWhSnapshot { get; set; }
}

public class ListingFeature {
    public int ListingId { get; set; }
    public int FeatureId { get; set; }
    public required string FeatureName { get; set; }
    public string? FeatureDescription { get; set; }
    public Listing? Listing { get; set; }
}
