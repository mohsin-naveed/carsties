namespace CatalogService.Entities;

public class Variant
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Engine { get; set; }
    public int? TransmissionId { get; set; }
    public Transmission? TransmissionRef { get; set; }

    public int? FuelTypeId { get; set; }
    public FuelType? FuelTypeRef { get; set; }

    public int DerivativeId { get; set; }
    public Derivative? Derivative { get; set; }

    public List<VariantFeature> VariantFeatures { get; set; } = new();
}
