namespace CatalogService.Entities;

public class FuelType
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string Code { get; set; } = string.Empty;
}
