using System.Collections.Generic;

namespace ListingService.DTOs;

public class FacetCountsDto
{
    public Dictionary<int, int> Makes { get; set; } = new();
    public Dictionary<int, int> Models { get; set; } = new();
    public Dictionary<int, int> Transmissions { get; set; } = new();
    public Dictionary<int, int> Bodies { get; set; } = new();
    public Dictionary<int, int> Fuels { get; set; } = new();
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
    public Dictionary<int, string> MakeLabels { get; set; } = new();
    public Dictionary<int, string> ModelLabels { get; set; } = new();
    // Map modelId -> makeId for parent filtering on the client
    public Dictionary<int, int> ModelMakeIds { get; set; } = new();
    public Dictionary<int, string> TransmissionLabels { get; set; } = new();
    public Dictionary<int, string> BodyLabels { get; set; } = new();
    public Dictionary<int, string> FuelLabels { get; set; } = new();
}
