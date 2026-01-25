using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;

namespace ListingService.Services;

public class CatalogClient
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public CatalogClient(HttpClient http, IConfiguration config)
    {
        _http = http;
        _baseUrl = config.GetSection("CatalogApi").GetValue<string>("BaseUrl") ?? "";
        if (!string.IsNullOrWhiteSpace(_baseUrl) && _baseUrl.EndsWith("/"))
            _baseUrl = _baseUrl.TrimEnd('/');
    }

    public async Task<DerivativeDto?> GetDerivativeByCodeAsync(string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_baseUrl)) return null;
        var url = $"{_baseUrl}/derivatives/by-code/{Uri.EscapeDataString(code)}";
        using var resp = await _http.GetAsync(url, ct);
        if (!resp.IsSuccessStatusCode) return null;
        var stream = await resp.Content.ReadAsStreamAsync(ct);
        return await JsonSerializer.DeserializeAsync<DerivativeDto>(stream, JsonOpts, ct);
    }

    public async Task<List<FeatureDetailDto>> GetFeaturesByCodesAsync(IEnumerable<string> codes, CancellationToken ct = default)
    {
        var list = codes?.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct(StringComparer.OrdinalIgnoreCase).ToArray() ?? Array.Empty<string>();
        if (list.Length == 0 || string.IsNullOrWhiteSpace(_baseUrl)) return new List<FeatureDetailDto>();
        var q = string.Join("&", list.Select(c => $"codes={Uri.EscapeDataString(c)}"));
        var url = $"{_baseUrl}/features/by-codes?{q}";
        using var resp = await _http.GetAsync(url, ct);
        if (!resp.IsSuccessStatusCode) return new List<FeatureDetailDto>();
        var stream = await resp.Content.ReadAsStreamAsync(ct);
        var result = await JsonSerializer.DeserializeAsync<List<FeatureDetailDto>>(stream, JsonOpts, ct);
        return result ?? new List<FeatureDetailDto>();
    }

    // Minimal DTOs for deserialization
    public record DerivativeDto(
        int Id,
        string Code,
        string? Name,
        int ModelId,
        int? GenerationId,
        int BodyTypeId,
        string? BodyType,
        int DriveTypeId,
        string? DriveType,
        short Seats,
        short Doors,
        int? EngineCC,
        decimal? EngineL,
        int? TransmissionId,
        string? Transmission,
        int? FuelTypeId,
        string? FuelType,
        decimal? BatteryKWh,
        bool IsActive
    );

    public record FeatureDetailDto(
        string Code,
        string Name,
        string? Description,
        string? FeatureCategoryName,
        string? FeatureCategoryCode
    );
}
