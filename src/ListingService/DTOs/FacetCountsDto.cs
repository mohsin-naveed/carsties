using System.Collections.Generic;

namespace ListingService.DTOs;

public class FacetCountsDto
{
    public Dictionary<int, int> Makes { get; set; } = new();
    public Dictionary<int, int> Models { get; set; } = new();
    public Dictionary<int, int> Transmissions { get; set; } = new();
    public Dictionary<int, int> Bodies { get; set; } = new();
    public Dictionary<int, int> Fuels { get; set; } = new();
}
