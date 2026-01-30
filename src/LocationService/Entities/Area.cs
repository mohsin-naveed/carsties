namespace LocationService.Entities;

public class Area
{
    public int Id { get; set; }
    public int CityId { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public City? City { get; set; }
}
