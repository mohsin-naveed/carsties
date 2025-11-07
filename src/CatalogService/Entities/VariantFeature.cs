namespace CatalogService.Entities;

public class VariantFeature
{
    public int VariantId { get; set; }
    public Variant? Variant { get; set; }

    public int FeatureId { get; set; }
    public Feature? Feature { get; set; }

    public bool IsStandard { get; set; } = true;
    public DateTime AddedDate { get; set; } = DateTime.UtcNow;
}
