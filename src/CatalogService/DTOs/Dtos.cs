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

public record VariantDto(int Id, string Name, string? Engine, int? TransmissionId, string? Transmission, int? FuelTypeId, string? FuelType, int GenerationId);
public record CreateVariantDto(string Name, int GenerationId, string? Engine, int? TransmissionId, int? FuelTypeId);
public record UpdateVariantDto(string? Name, int? GenerationId, string? Engine, int? TransmissionId, int? FuelTypeId);

public record FeatureDto(int Id, string Name, string? Description);
public record CreateFeatureDto(string Name, string? Description);
public record UpdateFeatureDto(string? Name, string? Description);

public record VariantFeatureDto(int VariantId, int FeatureId, bool IsStandard, DateTime AddedDate);
public record CreateVariantFeatureDto(int VariantId, int FeatureId, bool IsStandard);
public record UpdateVariantFeatureDto(bool? IsStandard);

// Grouped payload for Variants page to reduce client API calls
public record VariantsContextDto(
	List<MakeDto> Makes,
	List<ModelDto> Models,
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
	List<GenerationDto> Generations
);

public record VariantFeaturesContextDto(
	List<MakeDto> Makes,
	List<ModelDto> Models,
	List<GenerationDto> Generations,
	List<VariantDto> Variants,
	List<FeatureDto> Features
);

// Model Bodies
public record ModelBodyDto(int Id, int ModelId, int BodyTypeId, string? BodyType, short Seats, short Doors);
public record CreateModelBodyDto(int ModelId, int BodyTypeId, short Seats, short Doors);
public record UpdateModelBodyDto(int? ModelId, int? BodyTypeId, short? Seats, short? Doors);

public record ModelBodiesContextDto(
	List<MakeDto> Makes,
	List<ModelDto> Models,
	List<ModelBodyDto> ModelBodies
);
