namespace CatalogService.Entities;

public class Transmission
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string Code { get; set; } = string.Empty;
}
