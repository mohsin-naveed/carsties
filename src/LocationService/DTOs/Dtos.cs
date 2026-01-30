namespace LocationService.DTOs;

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);

// Provinces
public record ProvinceDto(int Id, string Code, string Name, DateTime CreatedAt, DateTime UpdatedAt);
public record CreateProvinceDto(string Name);
public record UpdateProvinceDto(string? Name);

// Cities
public record CityDto(int Id, string Code, string Name, string Slug, int ProvinceId, string? ProvinceName, DateTime CreatedAt, DateTime UpdatedAt);
public record CreateCityDto(string Name, int ProvinceId);
public record UpdateCityDto(string? Name, int? ProvinceId);

// Areas
public record AreaDto(int Id, string Code, string Name, string Slug, int CityId, string? CityName, decimal? Latitude, decimal? Longitude, DateTime CreatedAt, DateTime UpdatedAt);
public record CreateAreaDto(string Name, int CityId, decimal? Latitude, decimal? Longitude);
public record UpdateAreaDto(string? Name, int? CityId, decimal? Latitude, decimal? Longitude);

// Bulk
public record BulkItemInput(string Name);
public record BulkResultItem(string Name, bool Success, string? Error, string? Code, string? Slug, int? Id);
public record BulkResult(List<BulkResultItem> Items, int Succeeded, int Failed);
