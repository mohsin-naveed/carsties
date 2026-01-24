namespace ListingService.DTOs;

public class ListingDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Year { get; set; }
    public int Mileage { get; set; }
    public decimal Price { get; set; }
    public string? Color { get; set; }
    // Codes for Catalog references
    public string? MakeCode { get; set; }
    public string? ModelCode { get; set; }
    public string? GenerationCode { get; set; }
    public string? DerivativeCode { get; set; }
    public string? VariantCode { get; set; }
    public string? TransmissionTypeCode { get; set; }
    public string? FuelTypeCode { get; set; }
    public string? BodyTypeCode { get; set; }

    // Snapshots
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
    public decimal? EngineL { get; set; }
    public decimal? BatteryKWh { get; set; }

    // Note: Codes are already represented above

    public List<ListingImageDto> Images { get; set; } = new();
    // Back-compat: keep codes; also expose full feature snapshots
    public string[]? FeatureCodes { get; set; }
    public List<ListingFeatureDto>? Features { get; set; }
}

public class CreateListingDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Year { get; set; }
    public int Mileage { get; set; }
    public decimal Price { get; set; }
    public string? Color { get; set; }
    // Required codes instead of IDs
    public string MakeCode { get; set; } = string.Empty;
    public string ModelCode { get; set; } = string.Empty;
    public string GenerationCode { get; set; } = string.Empty;
    public string DerivativeCode { get; set; } = string.Empty;
    public string VariantCode { get; set; } = string.Empty;
    public string? TransmissionTypeCode { get; set; }
    public string? FuelTypeCode { get; set; }
    public string BodyTypeCode { get; set; } = string.Empty;

    // Optional snapshots supplied by client (names only)
    public string? MakeName { get; set; }
    public string? ModelName { get; set; }
    public string? GenerationName { get; set; }
    public string? DerivativeName { get; set; }
    public string? VariantName { get; set; }
    public string? BodyTypeName { get; set; }
    public string? TransmissionTypeName { get; set; }
    public string? FuelTypeName { get; set; }
    // New canonical snapshot fields (server will populate if omitted)
    public short? Seats { get; set; }
    public short? Doors { get; set; }
    public int? EngineSizeCC { get; set; }
    public decimal? EngineL { get; set; }
    public decimal? BatteryKWh { get; set; }
    // Preferred: full feature details; Back-compat: FeatureCodes
    public List<ListingFeatureInputDto>? Features { get; set; }
    public string[]? FeatureCodes { get; set; }
}

public class UpdateListingDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? Year { get; set; }
    public int? Mileage { get; set; }
    public decimal? Price { get; set; }
    public string? Color { get; set; }
    public string? MakeCode { get; set; }
    public string? ModelCode { get; set; }
    public string? GenerationCode { get; set; }
    public string? DerivativeCode { get; set; }
    public string? VariantCode { get; set; }
    public string? TransmissionTypeCode { get; set; }
    public string? FuelTypeCode { get; set; }
    public string? BodyTypeCode { get; set; }
    public short? Seats { get; set; }
    public short? Doors { get; set; }
    public List<ListingFeatureInputDto>? Features { get; set; }
    public string[]? FeatureCodes { get; set; }
}

// Reference DTOs for output
// Reference DTOs removed from ListingService; use CatalogService for reference data.

public class ListingImageDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? ThumbUrl { get; set; }
}

public class PaginatedResponse<T>
{
    public List<T> Data { get; set; } = new();
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class ListingFeatureInputDto
{
    public string FeatureCode { get; set; } = string.Empty;
    public string FeatureName { get; set; } = string.Empty;
    public string? FeatureDescription { get; set; }
    public string? FeatureCategoryName { get; set; }
    public string? FeatureCategoryCode { get; set; }
}

public class ListingFeatureDto
{
    public string FeatureCode { get; set; } = string.Empty;
    public string FeatureName { get; set; } = string.Empty;
    public string? FeatureDescription { get; set; }
    public string? FeatureCategoryName { get; set; }
    public string? FeatureCategoryCode { get; set; }
}
