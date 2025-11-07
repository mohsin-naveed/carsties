namespace CatalogService.Entities;

public class Model
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public int MakeId { get; set; }
    public Make? Make { get; set; }

    public List<Generation> Generations { get; set; } = new();
}
