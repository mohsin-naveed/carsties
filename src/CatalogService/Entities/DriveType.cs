namespace CatalogService.Entities;

public class DriveType
{
    public int Id { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
