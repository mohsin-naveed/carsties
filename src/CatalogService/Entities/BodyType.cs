namespace CatalogService.Entities;

public class BodyType
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public List<ModelBody> ModelBodies { get; set; } = new();
}
