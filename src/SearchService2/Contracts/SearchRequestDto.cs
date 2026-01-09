namespace CarSearch.Api.Contracts;

/// <summary>
/// Request DTO for car search with pagination and filtering parameters
/// </summary>
public sealed class SearchRequestDto
{
    // Pagination
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
    
    // Sorting
    public string? Sort { get; set; }
    public string? SortBy { get; set; }
    public string? SortDirection { get; set; }
    
    // Filtering parameters
    public string? Make { get; set; }
    public string? Model { get; set; }
    public string? Fuel { get; set; }
    public string? Transmission { get; set; }
    public string? BodyType { get; set; }
    public string? Colour { get; set; }
    public string? Status { get; set; }
    public bool? Ulez { get; set; }
    public bool? HasImages { get; set; }
    
    // Price range
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    
    // Mileage range
    public int? MinMileage { get; set; }
    public int? MaxMileage { get; set; }
    
    // BHP range
    public int? MinBhp { get; set; }
    public int? MaxBhp { get; set; }
    
    // Specific values
    public int? Seats { get; set; }
    public int? Doors { get; set; }
    public int? Year { get; set; }
    
    // Location/Site
    public string? Location { get; set; }
    public int? SiteId { get; set; }
}