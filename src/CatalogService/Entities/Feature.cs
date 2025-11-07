namespace CatalogService.Entities;

public class Feature
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }

    public List<VariantFeature> VariantFeatures { get; set; } = new();
}
