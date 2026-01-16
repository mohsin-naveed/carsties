namespace CatalogService.Entities;

public class Model
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsPopular { get; set; } = false;

    public int MakeId { get; set; }
    public Make? Make { get; set; }

    public List<Generation> Generations { get; set; } = new();
    public List<Derivative> Derivatives { get; set; } = new();
}
