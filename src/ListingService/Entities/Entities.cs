namespace ListingService.Entities;

public class Listing {
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int Year { get; set; }
    public int Mileage { get; set; }
    public decimal Price { get; set; }
    public string? Color { get; set; }
    public string? BodyColor { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Codes instead of IDs for Catalog references
    public string? MakeCode { get; set; }
    public string? ModelCode { get; set; }
    public string? GenerationCode { get; set; }
    public string? DerivativeCode { get; set; }
    public string? VariantCode { get; set; }
    public string? TransmissionTypeCode { get; set; }
    public string? FuelTypeCode { get; set; }
    public string? BodyTypeCode { get; set; }

    // Location snapshots (codes + names)
    public string? ProvinceCode { get; set; }
    public string? ProvinceName { get; set; }
    public string? CityCode { get; set; }
    public string? CityName { get; set; }
    public string? AreaCode { get; set; }
    public string? AreaName { get; set; }

    // Contact information
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }

    // Snapshot names from Catalog DB

    // Snapshot fields to decouple from CatalogService
    public string? MakeName { get; set; }
    public string? ModelName { get; set; }
    public string? GenerationName { get; set; }
    public string? DerivativeName { get; set; }
    public string? VariantName { get; set; }
    public string? BodyTypeName { get; set; }
    public string? TransmissionTypeName { get; set; }
    public string? FuelTypeName { get; set; }
    public short? Seats { get; set; }
    public short? Doors { get; set; }
    public int? EngineSizeCC { get; set; }
    public decimal? EngineSizeL { get; set; }
    public decimal? BatteryKWh { get; set; }

    // Images
    public ICollection<ListingImage> Images { get; set; } = new List<ListingImage>();
}

public class ListingFeature {
    public int ListingId { get; set; }
    public required string FeatureCode { get; set; }
    public required string FeatureName { get; set; }
    public string? FeatureDescription { get; set; }
    public string? FeatureCategoryName { get; set; }
    public string? FeatureCategoryCode { get; set; }
    public Listing? Listing { get; set; }
}

public class ListingImage
{
    public int Id { get; set; }
    public int ListingId { get; set; }
    public required string FileName { get; set; }
    public required string Url { get; set; }
    public string? ThumbUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public Listing? Listing { get; set; }
}
