using ListingService.Data;
using ListingService.Entities;
using ListingService.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;

namespace ListingService.Services;

public class CatalogSyncService
{
    private readonly HttpClient _http;
    public CatalogSyncService(HttpClient http)
    {
        _http = http;
    }

    public async Task SyncReferenceDataAsync(ListingDbContext db)
    {
        // Simple sync: replace all reference tables
        // Use relative paths (no leading slash) to honor BaseAddress path segment
        var makes = await _http.GetFromJsonAsync<List<MakeDto>>("makes") ?? new();
        var models = await _http.GetFromJsonAsync<List<ModelDto>>("models") ?? new();
        var generations = await _http.GetFromJsonAsync<List<GenerationDto>>("generations") ?? new();
        var derivatives = await _http.GetFromJsonAsync<List<DerivativeDto>>("derivatives") ?? new();
        var variants = await _http.GetFromJsonAsync<List<VariantDto>>("variants") ?? new();

        // Fetch transmissions and fuel types from /api/variants/options
        var variantOptions = await _http.GetFromJsonAsync<VariantOptionsDto>("variants/options") ?? new();
        var transmissions = variantOptions.transmissions ?? new();
        var fuelTypes = variantOptions.fuelTypes ?? new();

        // Body types are provided by derivatives options
        var bodyTypes = await _http.GetFromJsonAsync<List<OptionDto>>("derivatives/options") ?? new();
        // Clear and reinsert
        await ClearAllAsync(db);
        if (transmissions.Count == 0)
        {
            // fallback transmissions common set
            transmissions = new List<OptionDto>{ new(1,"Automatic"), new(2,"Manual"), new(3,"CVT") };
        }
        db.Transmissions.AddRange(transmissions.Select(t => new Transmission { Id = t.id, Name = t.name }));
        db.FuelTypes.AddRange(fuelTypes.Select(f => new FuelType { Id = f.id, Name = f.name }));
        db.BodyTypes.AddRange(bodyTypes.Select(b => new BodyType { Id = b.id, Name = b.name }));
        db.Makes.AddRange(makes.Select(m => new Make { Id = m.id, Name = m.name }));
        db.Models.AddRange(models.Select(m => new Model { Id = m.id, Name = m.name, MakeId = m.makeId }));
        db.Generations.AddRange(generations.Select(g => new Generation { Id = g.id, Name = g.name, ModelId = g.modelId, StartYear = (short?)g.startYear, EndYear = (short?)g.endYear }));
        db.Derivatives.AddRange(derivatives.Select(d => new Derivative { Id = d.id, Name = d.name ?? "", ModelId = d.modelId, GenerationId = d.generationId ?? 0, BodyTypeId = d.bodyTypeId, Seats = d.seats, Doors = d.doors, Engine = d.engine, TransmissionId = d.transmissionId, FuelTypeId = d.fuelTypeId, BatteryCapacityKWh = d.batteryCapacityKWh }));
        db.Variants.AddRange(variants.Select(v => new Variant { Id = v.id, Name = v.name, DerivativeId = v.derivativeId }));
        await db.SaveChangesAsync();
    }

    private static async Task ClearAllAsync(ListingDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"ListingFeatures\" CASCADE;");
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Listings\" CASCADE;");
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Variants\" CASCADE;");
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Derivatives\" CASCADE;");
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Generations\" CASCADE;");
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Models\" CASCADE;");
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Makes\" CASCADE;");
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Transmissions\" CASCADE;");
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"FuelTypes\" CASCADE;");
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"BodyTypes\" CASCADE;");
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Features\" CASCADE;");
    }

}
