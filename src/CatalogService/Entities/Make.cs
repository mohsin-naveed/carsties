namespace CatalogService.Entities;

public class Make
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public string Code { get; set; } = string.Empty;
    public string? Country { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsPopular { get; set; } = false;

    public List<Model> Models { get; set; } = new();
}
