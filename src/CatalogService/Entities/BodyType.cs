namespace CatalogService.Entities;

public class BodyType
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public List<Derivative> Derivatives { get; set; } = new();
}
