namespace CatalogService.Entities;

public class Make
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public List<Model> Models { get; set; } = new();
}
