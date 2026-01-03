namespace CatalogService.Entities;

public class Derivative
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int ModelId { get; set; }
    public Model? Model { get; set; }

    public int GenerationId { get; set; }
    public Generation Generation { get; set; } = null!;

    public int BodyTypeId { get; set; }
    public BodyType? BodyTypeRef { get; set; }

    public short Seats { get; set; }
    public short Doors { get; set; }

    public string? Engine { get; set; }
    public int? TransmissionId { get; set; }
    public Transmission? TransmissionRef { get; set; }
    public int? FuelTypeId { get; set; }
    public FuelType? FuelTypeRef { get; set; }
    public decimal? BatteryCapacityKWh { get; set; }
}
