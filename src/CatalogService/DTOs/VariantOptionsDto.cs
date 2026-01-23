namespace CatalogService.DTOs;

public record OptionDto(int Id, string Name, string Code);
public record VariantOptionsDto(List<OptionDto> Transmissions, List<OptionDto> FuelTypes);
