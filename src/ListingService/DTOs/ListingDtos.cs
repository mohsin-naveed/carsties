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
    public int MakeId { get; set; }
    public int ModelId { get; set; }
    public int GenerationId { get; set; }
    public int DerivativeId { get; set; }
    public int VariantId { get; set; }
    public int? TransmissionId { get; set; }
    public int? FuelTypeId { get; set; }
    public int BodyTypeId { get; set; }
}

public class CreateListingDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Year { get; set; }
    public int Mileage { get; set; }
    public decimal Price { get; set; }
    public string? Color { get; set; }
    public int MakeId { get; set; }
    public int ModelId { get; set; }
    public int GenerationId { get; set; }
    public int DerivativeId { get; set; }
    public int VariantId { get; set; }
    public int? TransmissionId { get; set; }
    public int? FuelTypeId { get; set; }
    public int BodyTypeId { get; set; }
}

public class UpdateListingDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? Year { get; set; }
    public int? Mileage { get; set; }
    public decimal? Price { get; set; }
    public string? Color { get; set; }
    public int? MakeId { get; set; }
    public int? ModelId { get; set; }
    public int? GenerationId { get; set; }
    public int? DerivativeId { get; set; }
    public int? VariantId { get; set; }
    public int? TransmissionId { get; set; }
    public int? FuelTypeId { get; set; }
    public int? BodyTypeId { get; set; }
}

// Reference DTOs for output
public record MakeDto(int id, string name);
public record ModelDto(int id, string name, int makeId);
public record GenerationDto(int id, string name, int modelId, int? startYear, int? endYear);
public record DerivativeDto(int id, string? name, int modelId, int? generationId, int bodyTypeId, short seats, short doors, string? engine, int? transmissionId, int? fuelTypeId, decimal? batteryCapacityKWh);
public record VariantDto(int id, string name, int derivativeId);
public record OptionDto(int id, string name);

public class VariantOptionsDto
{
    public List<OptionDto> transmissions { get; set; } = new();
    public List<OptionDto> fuelTypes { get; set; } = new();
    public List<OptionDto> bodyTypes { get; set; } = new();
}
