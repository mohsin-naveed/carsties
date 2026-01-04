using CatalogService.Entities;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CatalogService.Data;

public class DbInitializer
{
    public static void InitDb(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
        // Development: Drop DB, apply migrations, then seed
        if (app.Environment.IsDevelopment())
        {
            ResetDatabase(context);
        }
        context.Database.Migrate();

        // Only seed if migrations have been applied and schema exists
        if (context.Database.GetAppliedMigrations().Any())
        {
            SeedPakistanMarket(context);
        }
    }
    private static void ResetDatabase(CatalogDbContext context)
    {
        var cs = context.Database.GetConnectionString();
        if (string.IsNullOrEmpty(cs)) return;
        var builder = new NpgsqlConnectionStringBuilder(cs);
        var targetDb = builder.Database;
        // Connect to the default 'postgres' database to perform drop/create
        builder.Database = "postgres";
        using var conn = new NpgsqlConnection(builder.ConnectionString);
        conn.Open();
        using var cmd = conn.CreateCommand();
        // terminate active connections to target database
        cmd.CommandText = $"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{targetDb}' AND pid <> pg_backend_pid();";
        cmd.ExecuteNonQuery();
        // drop database
        cmd.CommandText = $"DROP DATABASE IF EXISTS \"{targetDb}\";";
        cmd.ExecuteNonQuery();
        // create database
        cmd.CommandText = $"CREATE DATABASE \"{targetDb}\";";
        cmd.ExecuteNonQuery();
        conn.Close();
    }


    public static void SeedPakistanMarket(CatalogDbContext context)
    {
        // Ensure reference data exists regardless of other data
        if (!context.Transmissions.Any())
        {
            var transmissions = new List<Transmission>
            {
                new() { Name = "Automatic" },
                new() { Name = "Manual" },
                new() { Name = "CVT" },
                new() { Name = "Dual-Clutch" }
            };
            context.Transmissions.AddRange(transmissions);
        }
        if (!context.FuelTypes.Any())
        {
            var fuelTypes = new List<FuelType>
            {
                new() { Name = "Petrol" },
                new() { Name = "Diesel" },
                new() { Name = "Hybrid" },
                new() { Name = "Plug-In Hybrid" },
                new() { Name = "Electric" }
            };
            context.FuelTypes.AddRange(fuelTypes);
        }
        if (!context.BodyTypes.Any())
        {
            var bodyTypes = new List<BodyType>
            {
                new() { Name = "Saloon" },
                new() { Name = "Estate" },
                new() { Name = "Hatchback" },
                new() { Name = "SUV" },
                new() { Name = "Coupe" },
                new() { Name = "Convertible" }
            };
            context.BodyTypes.AddRange(bodyTypes);
        }
        if (!context.Features.Any())
        {
            // Seed a small feature catalog used across variants
            var seedFeatures = new List<Feature>
            {
                new() { Name = "Air Conditioning", Description = "Automatic climate control" },
                new() { Name = "ABS", Description = "Anti-lock Braking System" },
                new() { Name = "Bluetooth", Description = "Hands-free connectivity" },
                new() { Name = "Cruise Control", Description = "Adaptive cruise control" },
                new() { Name = "Sunroof", Description = "Electric sunroof" }
            };
            context.Features.AddRange(seedFeatures);
        }
        context.SaveChanges();
        var transMap = context.Transmissions.ToDictionary(t => t.Name, t => t.Id);
        var fuelMap = context.FuelTypes.ToDictionary(f => f.Name, f => f.Id);
        // If there are already makes, we only needed to ensure reference data exists
        if (context.Makes.Any()) return;
        // At this point, features/transmissions/fuel types exist; get features for seeding variants
        var features = context.Features.ToList();

        Feature F(string name) => features.First(f => f.Name == name);

        // Helper to attach standard features to a variant
        void AddFeatures(Variant variant, params Feature[] feats)
        {
            foreach (var f in feats)
            {
                variant.VariantFeatures.Add(new VariantFeature
                {
                    Feature = f,
                    IsStandard = true
                });
            }
        }

        // Helper to construct a variant with features
        Variant BuildVariant(
            string name,
            string engine,
            string transmission,
            string fuelType,
            Func<string, Feature> featureFinder,
            Action<Variant, Feature[]> addFeatures,
            string[] featureNames)
        {
            var v = new Variant
            {
                Name = name,
                Engine = engine,
                TransmissionId = transMap.TryGetValue(transmission, out var tid) ? tid : (int?)null,
                FuelTypeId = fuelMap.TryGetValue(fuelType, out var fid) ? fid : (int?)null
            };
            var feats = featureNames.Select(featureFinder).ToArray();
            addFeatures(v, feats);
            return v;
        }
        // Seed Pakistan market makes/models
        var makes = new List<Make>
        {
            new()
            {
                Name = "Toyota",
                Models =
                {
                    new Model { Name = "Corolla" },
                    new Model { Name = "Yaris" },
                    new Model { Name = "Fortuner" }
                }
            },
            new()
            {
                Name = "Honda",
                Models =
                {
                    new Model { Name = "Civic" },
                    new Model { Name = "City" }
                }
            },
            new()
            {
                Name = "Suzuki",
                Models =
                {
                    new Model { Name = "Alto" },
                    new Model { Name = "Swift" }
                }
            },
            new()
            {
                Name = "Kia",
                Models =
                {
                    new Model { Name = "Sportage" },
                    new Model { Name = "Stonic" }
                }
            },
            new()
            {
                Name = "BMW",
                Models =
                {
                    new Model { Name = "3 Series" }
                }
            },
            new()
            {
                Name = "Audi",
                Models =
                {
                    new Model { Name = "A4" }
                }
            }
        };

        context.Makes.AddRange(makes);
        context.SaveChanges();

        // Create two generations per model
        var modelsForGen = context.Models.ToList();
        var generations = new List<Generation>();
        foreach (var m in modelsForGen)
        {
            generations.Add(new Generation { Name = "Gen 1", ModelId = m.Id, StartYear = 2016, EndYear = 2020 });
            generations.Add(new Generation { Name = "Gen 2", ModelId = m.Id, StartYear = 2021, EndYear = null });
        }
        context.Generations.AddRange(generations);
        context.SaveChanges();

        var gen2ByModelId = context.Generations
            .Where(g => g.Name == "Gen 2")
            .GroupBy(g => g.ModelId)
            .ToDictionary(g => g.Key, g => g.First().Id);

        // Derivatives per model (Pakistan-specific popular body types)
        var saloonId = context.BodyTypes.Where(b => b.Name == "Saloon").Select(b => b.Id).First();
        var hatchId = context.BodyTypes.Where(b => b.Name == "Hatchback").Select(b => b.Id).First();
        var suvId = context.BodyTypes.Where(b => b.Name == "SUV").Select(b => b.Id).First();

        var derivatives = new List<Derivative>();
        var allModels = context.Models.Include(m => m.Make).ToList();
        foreach (var m in allModels)
        {
            var bodyId = m.Name is "Alto" or "Swift" or "Yaris" ? hatchId : (m.Name is "Fortuner" or "Sportage" or "Stonic" ? suvId : saloonId);
            derivatives.Add(new Derivative
            {
                Name = m.Name + " Standard",
                ModelId = m.Id,
                GenerationId = gen2ByModelId[m.Id],
                BodyTypeId = bodyId,
                Seats = 5,
                Doors = bodyId == suvId ? (short)5 : (short)4,
                Engine = m.Name switch
                {
                    "Alto" => "0.66L",
                    "Swift" => "1.2L",
                    "Yaris" => "1.3L",
                    "Corolla" => "1.6L",
                    "Civic" => "1.5L Turbo",
                    "City" => "1.5L",
                    "Fortuner" => "2.7L",
                    "Sportage" => "2.0L",
                    "Stonic" => "1.4L",
                    "3 Series" => "2.0L",
                    "A4" => "2.0L",
                    _ => "1.6L"
                },
                TransmissionId = transMap["Automatic"],
                FuelTypeId = fuelMap["Petrol"],
                BatteryCapacityKWh = null
            });

            // Optional hybrid derivative for select models
            if (m.Name is "Corolla" or "Civic" or "Yaris")
            {
                derivatives.Add(new Derivative
                {
                    Name = m.Name + " Hybrid",
                    ModelId = m.Id,
                    GenerationId = gen2ByModelId[m.Id],
                    BodyTypeId = bodyId,
                    Seats = 5,
                    Doors = bodyId == suvId ? (short)5 : (short)4,
                    Engine = m.Name == "Civic" ? "2.0L" : "1.8L",
                    TransmissionId = transMap["CVT"],
                    FuelTypeId = fuelMap["Hybrid"],
                    BatteryCapacityKWh = 1.2m
                });
            }
        }
        context.Derivatives.AddRange(derivatives);
        context.SaveChanges();

        // Variants under each derivative
        var allDerivatives = context.Derivatives.Include(d => d.Model).ToList();
        var variants = new List<Variant>();
        foreach (var d in allDerivatives)
        {
            var baseVariant = BuildVariant(
                name: "Base",
                engine: d.Engine ?? "",
                transmission: context.Transmissions.First(t => t.Id == d.TransmissionId!).Name,
                fuelType: context.FuelTypes.First(f => f.Id == d.FuelTypeId!).Name,
                featureFinder: F,
                addFeatures: AddFeatures,
                featureNames: new[] { "Air Conditioning", "ABS", "Bluetooth" }
            );
            baseVariant.DerivativeId = d.Id;

            var premiumVariant = BuildVariant(
                name: "Premium",
                engine: d.Engine ?? "",
                transmission: context.Transmissions.First(t => t.Id == d.TransmissionId!).Name,
                fuelType: context.FuelTypes.First(f => f.Id == d.FuelTypeId!).Name,
                featureFinder: F,
                addFeatures: AddFeatures,
                featureNames: new[] { "Air Conditioning", "ABS", "Bluetooth", "Cruise Control", "Sunroof" }
            );
            premiumVariant.DerivativeId = d.Id;

            variants.Add(baseVariant);
            variants.Add(premiumVariant);
        }
        context.Variants.AddRange(variants);
        context.SaveChanges();
    }

    private static void EnsureGenerationRequired(CatalogDbContext context)
    {
        // Assign a generation to any derivative missing one
        var derivativesNeedingGen = context.Derivatives.Where(d => d.GenerationId == 0 || (EF.Property<int?>(d, nameof(d.GenerationId)) == null)).ToList();
        if (derivativesNeedingGen.Count > 0)
        {
            var models = context.Models.ToList();
            var gensByModel = context.Generations.AsEnumerable().GroupBy(g => g.ModelId).ToDictionary(g => g.Key, g => g.FirstOrDefault());
            foreach (var d in derivativesNeedingGen)
            {
                if (!gensByModel.TryGetValue(d.ModelId, out var gen) || gen == null)
                {
                    gen = new Generation { Name = "Gen 1", ModelId = d.ModelId };
                    context.Generations.Add(gen);
                    context.SaveChanges();
                }
                d.GenerationId = gen.Id;
            }
            context.SaveChanges();
        }

        try
        {
            // Make column NOT NULL
            context.Database.ExecuteSqlRaw("ALTER TABLE \"Derivatives\" ALTER COLUMN \"GenerationId\" SET NOT NULL;");
        }
        catch { /* ignore if already applied */ }

        try
        {
            // Adjust FK to cascade delete (drop then add)
            context.Database.ExecuteSqlRaw("ALTER TABLE \"Derivatives\" DROP CONSTRAINT IF EXISTS \"FK_Derivatives_Generations_GenerationId\";");
            context.Database.ExecuteSqlRaw("ALTER TABLE \"Derivatives\" ADD CONSTRAINT \"FK_Derivatives_Generations_GenerationId\" FOREIGN KEY (\"GenerationId\") REFERENCES \"Generations\"(\"Id\") ON DELETE CASCADE;");
        }
        catch { /* ignore if already applied */ }
    }

    private static void EnsureDerivativeEngineTransmissionFuel(CatalogDbContext context)
    {
        // Add new columns to Derivatives if they do not exist
        try { context.Database.ExecuteSqlRaw("ALTER TABLE \"Derivatives\" ADD COLUMN IF NOT EXISTS \"Engine\" character varying(100);"); } catch {}
        try { context.Database.ExecuteSqlRaw("ALTER TABLE \"Derivatives\" ADD COLUMN IF NOT EXISTS \"TransmissionId\" integer;"); } catch {}
        try { context.Database.ExecuteSqlRaw("ALTER TABLE \"Derivatives\" ADD COLUMN IF NOT EXISTS \"FuelTypeId\" integer;"); } catch {}

        // Add FKs if not present
        try { context.Database.ExecuteSqlRaw("ALTER TABLE \"Derivatives\" ADD CONSTRAINT IF NOT EXISTS \"FK_Derivatives_Transmissions_TransmissionId\" FOREIGN KEY (\"TransmissionId\") REFERENCES \"Transmissions\"(\"Id\") ON DELETE RESTRICT;"); } catch {}
        try { context.Database.ExecuteSqlRaw("ALTER TABLE \"Derivatives\" ADD CONSTRAINT IF NOT EXISTS \"FK_Derivatives_FuelTypes_FuelTypeId\" FOREIGN KEY (\"FuelTypeId\") REFERENCES \"FuelTypes\"(\"Id\") ON DELETE RESTRICT;"); } catch {}
    }

    public static void ClearCatalogData(CatalogDbContext context)
    {
        // Remove dependent rows in correct order
        context.VariantFeatures.RemoveRange(context.VariantFeatures);
        context.Variants.RemoveRange(context.Variants);
        context.Generations.RemoveRange(context.Generations);
        context.Variants.RemoveRange(context.Variants);
        context.Generations.RemoveRange(context.Generations);
        context.Derivatives.RemoveRange(context.Derivatives);
        context.Models.RemoveRange(context.Models);
        context.Makes.RemoveRange(context.Makes);
        context.SaveChanges();
    }
}
