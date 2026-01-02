using CatalogService.Entities;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Data;

public class DbInitializer
{
    public static void InitDb(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
        context.Database.Migrate();

        SeedIfEmpty(context);
    }

    public static void SeedIfEmpty(CatalogDbContext context)
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

        // Seed makes/models first (without generations) so we can attach model bodies explicitly
        var makes = new List<Make>
        {
            new()
            {
                Name = "BMW",
                Models =
                {
                    new Model
                    {
                        Name = "3 Series"
                    },
                    new Model
                    {
                        Name = "5 Series"
                    }
                }
            },
            new()
            {
                Name = "Audi",
                Models =
                {
                    new Model
                    {
                        Name = "A4"
                    },
                    new Model
                    {
                        Name = "A6"
                    }
                }
            },
            new()
            {
                Name = "Toyota",
                Models =
                {
                    new Model
                    {
                        Name = "Corolla"
                    },
                    new Model
                    {
                        Name = "Camry"
                    }
                }
            },
            new()
            {
                Name = "Kia",
                Models =
                {
                    new Model
                    {
                        Name = "Sportage"
                    },
                    new Model
                    {
                        Name = "Sorento"
                    }
                }
            },
            new()
            {
                Name = "Ford",
                Models =
                {
                    new Model
                    {
                        Name = "Focus"
                    },
                    new Model
                    {
                        Name = "Mustang"
                    }
                }
            }
        };

        context.Makes.AddRange(makes);
        context.SaveChanges();
        // Create a single default derivative per model
        var saloonId = context.BodyTypes.Where(b => b.Name == "Saloon").Select(b => b.Id).First();
        var derivatives = new List<Derivative>();
        var allModels = context.Models.Include(m => m.Make).ToList();
        foreach (var m in allModels)
        {
            derivatives.Add(new Derivative
            {
                ModelId = m.Id,
                GenerationId = null,
                BodyTypeId = saloonId,
                Seats = 5,
                Doors = 4
            });
        }
        context.Derivatives.AddRange(derivatives);
        context.SaveChanges();

        // Build robust maps for model -> derivative
        var modelIdsByName = context.Models.ToDictionary(m => m.Name, m => m.Id);
        var derivativeByModelId = context.Derivatives.ToDictionary(d => d.ModelId, d => d.Id);

        // Note: Generations and Variants are intentionally not seeded here to avoid FK issues.
        // They can be added via API once ModelBodies exist.
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
