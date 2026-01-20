namespace CatalogService.Entities;

public class Feature
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int FeatureCategoryId { get; set; }
    public FeatureCategory? Category { get; set; }

    public List<VariantFeature> VariantFeatures { get; set; } = new();
}
