namespace CatalogService.DTOs;

// Simple DTOs for CRUD
public record MakeDto(int Id, string Name);
public record CreateMakeDto(string Name);
public record UpdateMakeDto(string? Name);

public record ModelDto(int Id, string Name, int MakeId);
public record CreateModelDto(string Name, int MakeId);
public record UpdateModelDto(string? Name, int? MakeId);

public record GenerationDto(int Id, string Name, short? StartYear, short? EndYear, int ModelId);
public record CreateGenerationDto(string Name, int ModelId, short? StartYear, short? EndYear);
public record UpdateGenerationDto(string? Name, int? ModelId, short? StartYear, short? EndYear);

public record VariantDto(int Id, string Name, string? Engine, string? Transmission, string? FuelType, int GenerationId);
public record CreateVariantDto(string Name, int GenerationId, string? Engine, string? Transmission, string? FuelType);
public record UpdateVariantDto(string? Name, int? GenerationId, string? Engine, string? Transmission, string? FuelType);

public record FeatureDto(int Id, string Name, string? Description);
public record CreateFeatureDto(string Name, string? Description);
public record UpdateFeatureDto(string? Name, string? Description);

public record VariantFeatureDto(int VariantId, int FeatureId, bool IsStandard, DateTime AddedDate);
public record CreateVariantFeatureDto(int VariantId, int FeatureId, bool IsStandard);
public record UpdateVariantFeatureDto(bool? IsStandard);
