namespace CatalogService.Entities;

public class Derivative
{
    public int Id { get; set; }

    public int ModelId { get; set; }
    public Model? Model { get; set; }

    public int GenerationId { get; set; }
    public Generation Generation { get; set; } = null!;

    public int BodyTypeId { get; set; }
    public BodyType? BodyTypeRef { get; set; }

    public short Seats { get; set; }
    public short Doors { get; set; }
}
