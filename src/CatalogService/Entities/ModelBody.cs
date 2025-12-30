namespace CatalogService.Entities;

public class ModelBody
{
    public int Id { get; set; }

    public int ModelId { get; set; }
    public Model? Model { get; set; }

    public int BodyTypeId { get; set; }
    public BodyType? BodyTypeRef { get; set; }

    public short Seats { get; set; }
    public short Doors { get; set; }

    public List<Generation> Generations { get; set; } = new();
}
