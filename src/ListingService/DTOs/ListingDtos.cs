using System.ComponentModel.DataAnnotations;
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
    public string? BodyColor { get; set; }
    // Codes for Catalog references
    public string? MakeCode { get; set; }
    public string? ModelCode { get; set; }
    public string? GenerationCode { get; set; }
    public string? DerivativeCode { get; set; }
    public string? VariantCode { get; set; }
    public string? TransmissionTypeCode { get; set; }
    public string? FuelTypeCode { get; set; }
    public string? BodyTypeCode { get; set; }

    // Location snapshots
    public string? ProvinceCode { get; set; }
    public string? ProvinceName { get; set; }
    public string? CityCode { get; set; }
    public string? CityName { get; set; }
    public string? AreaCode { get; set; }
    public string? AreaName { get; set; }

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
    public decimal? EngineSizeL { get; set; }
    public decimal? BatteryKWh { get; set; }

    // Contact information
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }

    // Note: Codes are already represented above

    public List<ListingImageDto> Images { get; set; } = new();
    // Back-compat: keep codes; also expose full feature snapshots
    public string[]? FeatureCodes { get; set; }
    public List<ListingFeatureDto>? Features { get; set; }
}

public partial class CreateListingDto : IValidatableObject
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Year { get; set; }
    public int Mileage { get; set; }
    public decimal Price { get; set; }
    public string? Color { get; set; }
    public string? BodyColor { get; set; }
    // Required codes instead of IDs
    public string MakeCode { get; set; } = string.Empty;
    public string ModelCode { get; set; } = string.Empty;
    public string GenerationCode { get; set; } = string.Empty;
    public string DerivativeCode { get; set; } = string.Empty;
    public string? VariantCode { get; set; }
    public string? TransmissionTypeCode { get; set; }
    public string? FuelTypeCode { get; set; }
    public string BodyTypeCode { get; set; } = string.Empty;

    // Location snapshots
    public string? ProvinceCode { get; set; }
    public string? ProvinceName { get; set; }
    public string? CityCode { get; set; }
    public string? CityName { get; set; }
    public string? AreaCode { get; set; }
    public string? AreaName { get; set; }

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
    public decimal? EngineSizeL { get; set; }
    public decimal? BatteryKWh { get; set; }
    // Contact information
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    // Preferred: full feature details; Back-compat: FeatureCodes
    public List<ListingFeatureInputDto>? Features { get; set; }
    public string[]? FeatureCodes { get; set; }
}

public partial class CreateListingDto
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var currentYear = DateTime.UtcNow.Year;
        if (Year < 1886 || Year > currentYear + 1)
            yield return new ValidationResult($"year must be between 1886 and {currentYear + 1}.", new[] { nameof(Year) });

        if (Mileage < 0 || Mileage > 2_000_000)
            yield return new ValidationResult("mileage must be between 0 and 2,000,000.", new[] { nameof(Mileage) });

        // Keep price within a realistic range and within Int32 for facet bucketing.
        if (Price < 0 || Price > 2_000_000_000m)
            yield return new ValidationResult("price must be between 0 and 2,000,000,000.", new[] { nameof(Price) });

        if (EngineSizeCC is < 0 or > 20_000)
            yield return new ValidationResult("engineSizeCC must be between 0 and 20,000.", new[] { nameof(EngineSizeCC) });

        if (EngineSizeL is < 0 or > 20)
            yield return new ValidationResult("engineSizeL must be between 0 and 20.", new[] { nameof(EngineSizeL) });

        if (BatteryKWh is < 0 or > 500)
            yield return new ValidationResult("batteryKWh must be between 0 and 500.", new[] { nameof(BatteryKWh) });

        if (FeatureCodes is not null && FeatureCodes.Length > 0)
            yield return new ValidationResult("featureCodes is deprecated. Provide full feature metadata in 'features'.", new[] { nameof(FeatureCodes) });
        if (Features is null || Features.Count == 0)
            yield return new ValidationResult("features are required.", new[] { nameof(Features) });
        else
        {
            foreach (var f in Features)
            {
                if (string.IsNullOrWhiteSpace(f.FeatureCode)) yield return new ValidationResult("FeatureCode is required for each feature.", new[] { nameof(Features) });
                if (string.IsNullOrWhiteSpace(f.FeatureName)) yield return new ValidationResult($"FeatureName is required for feature '{f.FeatureCode}'.", new[] { nameof(Features) });
                if (string.IsNullOrWhiteSpace(f.FeatureCategoryName)) yield return new ValidationResult($"FeatureCategoryName is required for feature '{f.FeatureCode}'.", new[] { nameof(Features) });
                if (string.IsNullOrWhiteSpace(f.FeatureCategoryCode)) yield return new ValidationResult($"FeatureCategoryCode is required for feature '{f.FeatureCode}'.", new[] { nameof(Features) });
            }
        }
        yield break;
    }
}

public partial class UpdateListingDto : IValidatableObject
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? Year { get; set; }
    public int? Mileage { get; set; }
    public decimal? Price { get; set; }
    public string? Color { get; set; }
    public string? BodyColor { get; set; }
    public string? MakeCode { get; set; }
    public string? ModelCode { get; set; }
    public string? GenerationCode { get; set; }
    public string? DerivativeCode { get; set; }
    public string? VariantCode { get; set; }
    public string? TransmissionTypeCode { get; set; }
    public string? FuelTypeCode { get; set; }
    public string? BodyTypeCode { get; set; }
    // Location snapshots
    public string? ProvinceCode { get; set; }
    public string? ProvinceName { get; set; }
    public string? CityCode { get; set; }
    public string? CityName { get; set; }
    public string? AreaCode { get; set; }
    public string? AreaName { get; set; }
    public short? Seats { get; set; }
    public short? Doors { get; set; }
    public int? EngineSizeCC { get; set; }
    public decimal? EngineSizeL { get; set; }
    public decimal? BatteryKWh { get; set; }
    // Contact information
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public List<ListingFeatureInputDto>? Features { get; set; }
    public string[]? FeatureCodes { get; set; }
}

public partial class UpdateListingDto
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var currentYear = DateTime.UtcNow.Year;
        if (Year.HasValue && (Year.Value < 1886 || Year.Value > currentYear + 1))
            yield return new ValidationResult($"year must be between 1886 and {currentYear + 1}.", new[] { nameof(Year) });

        if (Mileage.HasValue && (Mileage.Value < 0 || Mileage.Value > 2_000_000))
            yield return new ValidationResult("mileage must be between 0 and 2,000,000.", new[] { nameof(Mileage) });

        if (Price.HasValue && (Price.Value < 0 || Price.Value > 2_000_000_000m))
            yield return new ValidationResult("price must be between 0 and 2,000,000,000.", new[] { nameof(Price) });

        if (EngineSizeCC.HasValue && (EngineSizeCC.Value < 0 || EngineSizeCC.Value > 20_000))
            yield return new ValidationResult("engineSizeCC must be between 0 and 20,000.", new[] { nameof(EngineSizeCC) });

        if (EngineSizeL.HasValue && (EngineSizeL.Value < 0 || EngineSizeL.Value > 20))
            yield return new ValidationResult("engineSizeL must be between 0 and 20.", new[] { nameof(EngineSizeL) });

        if (BatteryKWh.HasValue && (BatteryKWh.Value < 0 || BatteryKWh.Value > 500))
            yield return new ValidationResult("batteryKWh must be between 0 and 500.", new[] { nameof(BatteryKWh) });

        if (FeatureCodes is not null && FeatureCodes.Length > 0)
            yield return new ValidationResult("featureCodes is deprecated. Provide full feature metadata in 'features'.", new[] { nameof(FeatureCodes) });
        // For updates, require features present to align with new policy
        if (Features is null || Features.Count == 0)
            yield return new ValidationResult("features are required on update.", new[] { nameof(Features) });
        else
        {
            foreach (var f in Features)
            {
                if (string.IsNullOrWhiteSpace(f.FeatureCode)) yield return new ValidationResult("FeatureCode is required for each feature.", new[] { nameof(Features) });
                if (string.IsNullOrWhiteSpace(f.FeatureName)) yield return new ValidationResult($"FeatureName is required for feature '{f.FeatureCode}'.", new[] { nameof(Features) });
                if (string.IsNullOrWhiteSpace(f.FeatureCategoryName)) yield return new ValidationResult($"FeatureCategoryName is required for feature '{f.FeatureCode}'.", new[] { nameof(Features) });
                if (string.IsNullOrWhiteSpace(f.FeatureCategoryCode)) yield return new ValidationResult($"FeatureCategoryCode is required for feature '{f.FeatureCode}'.", new[] { nameof(Features) });
            }
        }
        yield break;
    }
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
