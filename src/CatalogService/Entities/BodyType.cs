namespace CatalogService.Entities;

public class BodyType
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string Code { get; set; } = string.Empty;

    public List<Derivative> Derivatives { get; set; } = new();
}
