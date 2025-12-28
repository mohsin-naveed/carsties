namespace CatalogService.DTOs;

public record OptionDto(int Id, string Name);
public record VariantOptionsDto(List<OptionDto> Transmissions, List<OptionDto> FuelTypes);
