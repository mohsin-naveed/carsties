namespace CatalogService.DTOs;

// Simple DTOs for CRUD
public record MakeDto(int Id, string Name, string Code, string? Country, bool IsActive, bool IsPopular);
public record CreateMakeDto(string Name, string? Country, bool? IsActive, bool? IsPopular);
public record UpdateMakeDto(string? Name, string? Country, bool? IsActive, bool? IsPopular);

public record ModelDto(int Id, string Name, string Code, int MakeId, bool IsActive, bool IsPopular);
public record CreateModelDto(string Name, int MakeId, bool? IsActive, bool? IsPopular);
public record UpdateModelDto(string? Name, int? MakeId, bool? IsActive, bool? IsPopular);

public record GenerationDto(int Id, string Name, short? StartYear, short? EndYear, int ModelId);
public record CreateGenerationDto(string Name, int ModelId, short? StartYear, short? EndYear);
public record UpdateGenerationDto(string? Name, int? ModelId, short? StartYear, short? EndYear);

public record VariantDto(int Id, string Name, string Code, int DerivativeId, bool IsPopular, bool IsImported);
public record CreateVariantDto(string Name, int DerivativeId, bool? IsPopular, bool? IsImported);
public record UpdateVariantDto(string? Name, int? DerivativeId, bool? IsPopular, bool? IsImported);

public record FeatureDto(int Id, string Name, string? Description, int FeatureCategoryId, string? FeatureCategory);
public record CreateFeatureDto(string Name, string? Description, int FeatureCategoryId);
public record UpdateFeatureDto(string? Name, string? Description, int? FeatureCategoryId);

public record VariantFeatureDto(int VariantId, int FeatureId, bool IsStandard, DateTime AddedDate);
public record CreateVariantFeatureDto(int VariantId, int FeatureId, bool IsStandard);
public record UpdateVariantFeatureDto(bool? IsStandard);

// Grouped payload for Variants page to reduce client API calls
public record VariantsContextDto(
	List<MakeDto> Makes,
	List<ModelDto> Models,
	List<DerivativeDto> Derivatives,
	List<GenerationDto> Generations,
	List<VariantDto> Variants
);

public record ModelsContextDto(
	List<MakeDto> Makes,
	List<ModelDto> Models
);

public record GenerationsContextDto(
	List<MakeDto> Makes,
	List<ModelDto> Models,
	List<DerivativeDto> Derivatives,
	List<GenerationDto> Generations
);


// Model Bodies
public record DerivativeDto(int Id, string Code, string? Name, int ModelId, int? GenerationId, int BodyTypeId, string? BodyType, int DriveTypeId, string? DriveType, short Seats, short Doors, string? Engine, int? TransmissionId, string? Transmission, int? FuelTypeId, string? FuelType, decimal? BatteryCapacityKWh, bool IsActive);
public record CreateDerivativeDto(string Name, int ModelId, int GenerationId, int BodyTypeId, int DriveTypeId, short Seats, short Doors, string? Engine, int? TransmissionId, int? FuelTypeId, decimal? BatteryCapacityKWh, bool? IsActive);
public record UpdateDerivativeDto(string? Name, int? ModelId, int? GenerationId, int? BodyTypeId, int? DriveTypeId, short? Seats, short? Doors, string? Engine, int? TransmissionId, int? FuelTypeId, decimal? BatteryCapacityKWh, bool? IsActive);

public record DerivativesContextDto(
	List<MakeDto> Makes,
	List<ModelDto> Models,
	List<DerivativeDto> Derivatives
);

// Generic paged result for server-side pagination
public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);
