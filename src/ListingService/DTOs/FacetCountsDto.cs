using System.Collections.Generic;

namespace ListingService.DTOs;

public class FacetCountsDto
{
    public Dictionary<string, int> Makes { get; set; } = new();
    public Dictionary<string, int> Models { get; set; } = new();
    public Dictionary<string, int> Transmissions { get; set; } = new();
    public Dictionary<string, int> Bodies { get; set; } = new();
    public Dictionary<string, int> Fuels { get; set; } = new();
    public Dictionary<int, int> Seats { get; set; } = new();
    public Dictionary<int, int> Doors { get; set; } = new();
    public Dictionary<int, int> Years { get; set; } = new();
    public Dictionary<int, int> Prices { get; set; } = new();
    public Dictionary<int, int> Mileages { get; set; } = new();
    public int PriceStep { get; set; }
    public int MileageStep { get; set; }
    public int? MinMileage { get; set; }
    public Dictionary<int, int> MileageExact { get; set; } = new();

    // Labels for facets derived from Listing snapshots to avoid Catalog dependency
    public Dictionary<string, string> MakeLabels { get; set; } = new();
    public Dictionary<string, string> ModelLabels { get; set; } = new();
    // Map modelCode -> makeCode for parent filtering on the client
    public Dictionary<string, string> ModelMakeCodes { get; set; } = new();
    public Dictionary<string, string> TransmissionLabels { get; set; } = new();
    public Dictionary<string, string> BodyLabels { get; set; } = new();
    public Dictionary<string, string> FuelLabels { get; set; } = new();
}
