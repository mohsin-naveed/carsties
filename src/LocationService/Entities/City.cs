namespace LocationService.Entities;

public class City
{
    public int Id { get; set; }
    public int ProvinceId { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Province? Province { get; set; }
    public List<Area> Areas { get; set; } = new();
}
