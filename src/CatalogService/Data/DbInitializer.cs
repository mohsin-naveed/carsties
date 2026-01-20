using CatalogService.Entities;
using CatalogService.RequestHelpers;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Text.RegularExpressions;

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
        // Seed DriveTypes
        if (!context.DriveTypes.Any())
        {
            var dtnames = new[] { "Front Wheel Drive", "Rear Wheel Drive", "Four Wheel Drive" };
            foreach (var dn in dtnames)
            {
                var dt = new Entities.DriveType { Name = dn, Code = CodeGenerator.NextDriveTypeCodeAsync(context).GetAwaiter().GetResult(), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
                context.DriveTypes.Add(dt);
                context.SaveChanges();
            }
        }
        // Ensure reference data exists regardless of other data
        if (!context.Transmissions.Any())
        {
            var transNames = new[] { "Automatic", "Manual", "CVT", "Dual-Clutch" };
            foreach (var tn in transNames)
            {
                var t = new Transmission { Name = tn, Code = CodeGenerator.NextTransmissionCodeAsync(context).GetAwaiter().GetResult() };
                context.Transmissions.Add(t);
                context.SaveChanges();
            }
        }
        if (!context.FuelTypes.Any())
        {
            var fuelNames = new[] { "Petrol", "Diesel", "Electric", "Hybrid", "PHEV", "CNG", "LPG", "REEV" };
            foreach (var fn in fuelNames)
            {
                var f = new FuelType { Name = fn, Code = CodeGenerator.NextFuelTypeCodeAsync(context).GetAwaiter().GetResult() };
                context.FuelTypes.Add(f);
                context.SaveChanges();
            }
        }
        if (!context.BodyTypes.Any())
        {
            var names = new[]
            {
                "Sedan","Hatchback","Crossover","SUV","MPV","Compact sedan","Compact SUV","Convertible","Coupe","Double Cabin","High Roof","Micro Van","Mini Van","Mini Vehicles","Off-Road","Vehicles","Pick Up","Single Cabin","Station Wagon","Truck","Van"
            };
            foreach (var n in names)
            {
                var bt = new BodyType { Name = n, Code = CodeGenerator.NextBodyTypeCodeAsync(context).GetAwaiter().GetResult() };
                context.BodyTypes.Add(bt);
                context.SaveChanges();
            }
        }
        // Seed Feature Categories
        if (!context.FeatureCategories.Any())
        {
            context.FeatureCategories.AddRange(
                new FeatureCategory { Code = "FC-001", Name = "Comfort", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new FeatureCategory { Code = "FC-002", Name = "Exterior", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new FeatureCategory { Code = "FC-003", Name = "Interior", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new FeatureCategory { Code = "FC-004", Name = "Safety", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
            );
        }
        context.SaveChanges();
        // Rename legacy category names to new ones if present
        var legacyComfort = context.FeatureCategories.FirstOrDefault(c => c.Name == "ComfortConvenience");
        if (legacyComfort != null)
        {
            legacyComfort.Name = "Comfort";
            legacyComfort.Code = "FC-001";
        }
        var legacySafety = context.FeatureCategories.FirstOrDefault(c => c.Name == "SafetySecurity");
        if (legacySafety != null)
        {
            legacySafety.Name = "Safety";
            legacySafety.Code = "FC-004";
        }
        context.SaveChanges();
        var catMap = context.FeatureCategories.ToDictionary(c => c.Name, c => c.Id);

        // Replace existing features with provided list and FE- codes
        if (context.Features.Any())
        {
            context.Features.RemoveRange(context.Features);
            context.SaveChanges();
        }
        var featureNames = new[]
        {
            "ABS",
            "Air Bags",
            "Air Conditioning",
            "Alloy Rims",
            "Android Auto",
            "Apple CarPlay",
            "360 Camera",
            "Climate Control",
            "Cruise Control",
            "DRLs",
            "Fog Lights",
            "Front Camera",
            "Front Speakers",
            "Head Up Display (HUD)",
            "Heated Seats",
            "Immobilizer Key",
            "Infotainment System",
            "Keyless Entry",
            "LED Headlights",
            "Paddle Shifters",
            "Panoramic Sunroof",
            "Parking Sensors",
            "Power Locks",
            "Power Mirrors",
            "Power Seats",
            "Power Steering",
            "Push Start",
            "Rear AC Vents",
            "Rear Camera",
            "Rear Speakers",
            "Steering Switches",
            "Sun Roof",
            "Tyre Pressure Monitoring System (TPMS)",
            "Traction Control",
            "Ventilated Seats"
        };
        var featuresToSeed = new List<Feature>();
        var seq = 1;
        foreach (var n in featureNames)
        {
            var code = $"FR-{seq:000}";
            // guarantee uniqueness just in case
            while (context.Features.Any(f => f.Code == code) || featuresToSeed.Any(f => f.Code.Equals(code, StringComparison.OrdinalIgnoreCase)))
            {
                seq++;
                code = $"FR-{seq:000}";
            }
            featuresToSeed.Add(new Feature
            {
                Name = n,
                Code = code,
                Slug = SlugGenerator.Generate("fr"),
                Description = null,
                FeatureCategoryId = catMap.ContainsKey("Comfort") ? catMap["Comfort"] : catMap.Values.First()
            });
            seq++;
        }
        context.Features.AddRange(featuresToSeed);
        context.SaveChanges();
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
        // Seed Pakistan market makes/models (allocate codes sequentially within batch)
        var makes = new List<Make>
        {
            new()
            {
                Name = "Toyota", IsActive = true, IsPopular = true,
                Models =
                {
                    new Model { Name = "Corolla", IsActive = true, IsPopular = true },
                    new Model { Name = "Yaris", IsActive = true, IsPopular = true },
                    new Model { Name = "Fortuner", IsActive = true, IsPopular = false }
                }
            },
            new()
            {
                Name = "Honda", IsActive = true, IsPopular = true,
                Models =
                {
                    new Model { Name = "Civic", IsActive = true, IsPopular = true },
                    new Model { Name = "City", IsActive = true, IsPopular = false }
                }
            },
            new()
            {
                Name = "Suzuki", IsActive = true, IsPopular = true,
                Models =
                {
                    new Model { Name = "Alto", IsActive = true, IsPopular = true },
                    new Model { Name = "Swift", IsActive = true, IsPopular = true }
                }
            },
            new()
            {
                Name = "Kia", IsActive = true, IsPopular = false,
                Models =
                {
                    new Model { Name = "Sportage", IsActive = true, IsPopular = true },
                    new Model { Name = "Stonic", IsActive = true, IsPopular = false }
                }
            },
            new()
            {
                Name = "BMW", IsActive = true, IsPopular = true,
                Models =
                {
                    new Model { Name = "3 Series", IsActive = true, IsPopular = false }
                }
            },
            new()
            {
                Name = "Audi", IsActive = true, IsPopular = false,
                Models =
                {
                    new Model { Name = "A4", IsActive = true, IsPopular = false }
                }
            }
        };

        // Helper to parse numeric part of codes like XX-001
        static int ParseSeq(string code)
        {
            var m = Regex.Match(code ?? string.Empty, "^[A-Z]{2}-(?<n>\\d+)$");
            return m.Success ? int.Parse(m.Groups["n"].Value) : 0;
        }

        // Allocate Make codes
        var mkStartCode = RequestHelpers.CodeGenerator.NextMakeCodeAsync(context).GetAwaiter().GetResult();
        var mkSeq = ParseSeq(mkStartCode);
        for (int i = 0; i < makes.Count; i++)
        {
            makes[i].Code = $"MK-{(mkSeq + i):000}";
            makes[i].Slug = SlugGenerator.Generate("mk");
        }
        // Allocate Model codes
        var allModelsSeed = makes.SelectMany(m => m.Models).ToList();
        var mdStartCode = RequestHelpers.CodeGenerator.NextModelCodeAsync(context).GetAwaiter().GetResult();
        var mdSeq = ParseSeq(mdStartCode);
        for (int i = 0; i < allModelsSeed.Count; i++)
        {
            allModelsSeed[i].Code = $"MD-{(mdSeq + i):000}";
            allModelsSeed[i].Slug = SlugGenerator.Generate("md");
        }

        context.Makes.AddRange(makes);
        context.SaveChanges();

        // Create two generations per model
        var modelsForGen = context.Models.ToList();
        var generations = new List<Generation>();
        var gnStartCode = RequestHelpers.CodeGenerator.NextGenerationCodeAsync(context).GetAwaiter().GetResult();
        var gnSeq = ParseSeq(gnStartCode);
        foreach (var m in modelsForGen)
        {
            var g1 = new Generation { Name = "Gen 1", ModelId = m.Id, StartYear = 2016, EndYear = 2020, Code = $"GN-{gnSeq:000}" };
            generations.Add(g1);
            gnSeq++;
            var g2 = new Generation { Name = "Gen 2", ModelId = m.Id, StartYear = 2021, EndYear = null, Code = $"GN-{gnSeq:000}" };
            generations.Add(g2);
            gnSeq++;
        }
        context.Generations.AddRange(generations);
        context.SaveChanges();

        var gen2ByModelId = context.Generations
            .Where(g => g.Name == "Gen 2")
            .GroupBy(g => g.ModelId)
            .ToDictionary(g => g.Key, g => g.First().Id);

        // Derivatives per model (Pakistan-specific popular body types)
        var saloonId = context.BodyTypes.Where(b => b.Name == "Sedan" || b.Name == "Saloon").Select(b => b.Id).First();
        var hatchId = context.BodyTypes.Where(b => b.Name == "Hatchback").Select(b => b.Id).First();
        var suvId = context.BodyTypes.Where(b => b.Name == "SUV").Select(b => b.Id).First();

        var derivatives = new List<Derivative>();
        var allModels = context.Models.Include(m => m.Make).ToList();
        var driveMap = context.DriveTypes.ToDictionary(d => d.Name, d => d.Id);
        var drStartCode = RequestHelpers.CodeGenerator.NextDerivativeCodeAsync(context).GetAwaiter().GetResult();
        var drSeq = ParseSeq(drStartCode);
        foreach (var m in allModels)
        {
            var bodyId = m.Name is "Alto" or "Swift" or "Yaris" ? hatchId : (m.Name is "Fortuner" or "Sportage" or "Stonic" ? suvId : saloonId);
            var d = new Derivative
            {
                Name = m.Name + " Standard",
                ModelId = m.Id,
                GenerationId = gen2ByModelId[m.Id],
                BodyTypeId = bodyId,
                DriveTypeId = (m.Name is "3 Series" or "A4") ? driveMap["Rear Wheel Drive"] : driveMap["Front Wheel Drive"],
                Seats = 5,
                Doors = bodyId == suvId ? (short)5 : (short)4,
                EngineCC = null,
                EngineL = null,
                TransmissionId = transMap["Automatic"],
                FuelTypeId = fuelMap["Petrol"],
                BatteryKWh = null,
                IsActive = true,
                Code = $"DR-{drSeq:000}"
            };
            derivatives.Add(d);
            drSeq++;

            // Optional hybrid derivative for select models
            if (m.Name is "Corolla" or "Civic" or "Yaris")
            {
                var dh = new Derivative
                {
                    Name = m.Name + " Hybrid",
                    ModelId = m.Id,
                    GenerationId = gen2ByModelId[m.Id],
                    BodyTypeId = bodyId,
                    DriveTypeId = driveMap["Front Wheel Drive"],
                    Seats = 5,
                    Doors = bodyId == suvId ? (short)5 : (short)4,
                    EngineCC = null,
                    EngineL = null,
                    TransmissionId = transMap["CVT"],
                    FuelTypeId = fuelMap["Hybrid"],
                    BatteryKWh = 1.2m,
                    IsActive = true,
                    Code = $"DR-{drSeq:000}"
                };
                derivatives.Add(dh);
                drSeq++;
            }
        }
        context.Derivatives.AddRange(derivatives);
        context.SaveChanges();

        // Variants under each derivative
        var allDerivatives = context.Derivatives.Include(d => d.Model).ToList();
        var variants = new List<Variant>();
        var vrStartCode = RequestHelpers.CodeGenerator.NextVariantCodeAsync(context).GetAwaiter().GetResult();
        var vrSeq = ParseSeq(vrStartCode);
        foreach (var d in allDerivatives)
        {
            var baseVariant = BuildVariant(
                name: "Base",
                engine: (d.EngineL.HasValue ? $"{d.EngineL.Value:0.0}L" : (d.EngineCC.HasValue ? $"{d.EngineCC.Value}cc" : "")),
                transmission: context.Transmissions.First(t => t.Id == d.TransmissionId!).Name,
                fuelType: context.FuelTypes.First(f => f.Id == d.FuelTypeId!).Name,
                featureFinder: F,
                addFeatures: AddFeatures,
                featureNames: new[] { "Air Conditioning", "ABS", "Power Steering" }
            );
            baseVariant.DerivativeId = d.Id;
            baseVariant.Code = $"VR-{vrSeq:000}";
            vrSeq++;

            var premiumVariant = BuildVariant(
                name: "Premium",
                engine: (d.EngineL.HasValue ? $"{d.EngineL.Value:0.0}L" : (d.EngineCC.HasValue ? $"{d.EngineCC.Value}cc" : "")),
                transmission: context.Transmissions.First(t => t.Id == d.TransmissionId!).Name,
                fuelType: context.FuelTypes.First(f => f.Id == d.FuelTypeId!).Name,
                featureFinder: F,
                addFeatures: AddFeatures,
                featureNames: new[] { "Air Conditioning", "ABS", "Power Steering", "Cruise Control", "Sun Roof" }
            );
            premiumVariant.DerivativeId = d.Id;
            premiumVariant.Code = $"VR-{vrSeq:000}";
            vrSeq++;

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
