namespace ListingService.Entities;

public class Make { public int Id { get; set; } public required string Name { get; set; } public List<Model> Models { get; set; } = new(); }
public class Model { public int Id { get; set; } public required string Name { get; set; } public int MakeId { get; set; } public Make? Make { get; set; } public List<Generation> Generations { get; set; } = new(); public List<Derivative> Derivatives { get; set; } = new(); }
public class Generation { public int Id { get; set; } public required string Name { get; set; } public short? StartYear { get; set; } public short? EndYear { get; set; } public int ModelId { get; set; } public Model? Model { get; set; } }
public class BodyType { public int Id { get; set; } public required string Name { get; set; } public List<Derivative> Derivatives { get; set; } = new(); }
public class Transmission { public int Id { get; set; } public required string Name { get; set; } }
public class FuelType { public int Id { get; set; } public required string Name { get; set; } }
public class Feature { public int Id { get; set; } public required string Name { get; set; } public string? Description { get; set; } }

public class Derivative {
    public int Id { get; set; }
    public required string Name { get; set; }
    public int ModelId { get; set; }
    public Model? Model { get; set; }
    public int GenerationId { get; set; }
    public Generation? Generation { get; set; }
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

public class Variant {
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Engine { get; set; }
    public int? TransmissionId { get; set; }
    public Transmission? TransmissionRef { get; set; }
    public int? FuelTypeId { get; set; }
    public FuelType? FuelTypeRef { get; set; }
    public int DerivativeId { get; set; }
    public Derivative? Derivative { get; set; }
}

public class Listing {
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int Year { get; set; }
    public int Mileage { get; set; }
    public decimal Price { get; set; }
    public string? Color { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int MakeId { get; set; }
    public int ModelId { get; set; }
    public int GenerationId { get; set; }
    public int DerivativeId { get; set; }
    public int VariantId { get; set; }
    public int? TransmissionId { get; set; }
    public int? FuelTypeId { get; set; }
    public int BodyTypeId { get; set; }

    public List<ListingFeature> Features { get; set; } = new();
    public Variant? Variant { get; set; }
}

public class ListingFeature {
    public int ListingId { get; set; }
    public int FeatureId { get; set; }
    public Feature? Feature { get; set; }
}
