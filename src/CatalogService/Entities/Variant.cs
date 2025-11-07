namespace CatalogService.Entities;

public class Variant
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Engine { get; set; }
    public string? Transmission { get; set; }
    public string? FuelType { get; set; }

    public int GenerationId { get; set; }
    public Generation? Generation { get; set; }

    public List<VariantFeature> VariantFeatures { get; set; } = new();
}
