namespace CatalogService.Entities;

public class Generation
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public short? StartYear { get; set; }
    public short? EndYear { get; set; }

    public int ModelBodyId { get; set; }
    public ModelBody? ModelBody { get; set; }

    public List<Variant> Variants { get; set; } = new();
}
