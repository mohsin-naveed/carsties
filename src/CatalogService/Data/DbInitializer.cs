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

        var makes = new List<Make>
        {
            new()
            {
                Name = "BMW",
                Models =
                {
                    new Model
                    {
                        Name = "3 Series",
                        Generations =
                        {
                            new Generation
                            {
                                Name = "G20",
                                StartYear = 2018,
                                Variants =
                                {
                                    BuildVariant("320i", "2.0L I4 Turbo", "Automatic", "Petrol", F, AddFeatures,
                                        new[]{"Air Conditioning","Bluetooth","ABS"}),
                                    BuildVariant("330i", "2.0L I4 Turbo", "Automatic", "Petrol", F, AddFeatures,
                                        new[]{"Air Conditioning","Bluetooth","Cruise Control"})
                                }
                            }
                        }
                    },
                    new Model
                    {
                        Name = "5 Series",
                        Generations =
                        {
                            new Generation
                            {
                                Name = "G30",
                                StartYear = 2017,
                                Variants =
                                {
                                    BuildVariant("520d", "2.0L I4 Diesel", "Automatic", "Diesel", F, AddFeatures,
                                        new[]{"Air Conditioning","Bluetooth","Cruise Control"})
                                }
                            }
                        }
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
                        Name = "A4",
                        Generations =
                        {
                            new Generation
                            {
                                Name = "B9",
                                StartYear = 2016,
                                Variants =
                                {
                                    BuildVariant("35 TFSI", "2.0L I4 Turbo", "Automatic", "Petrol", F, AddFeatures,
                                        new[]{"Air Conditioning","Bluetooth","ABS"})
                                }
                            }
                        }
                    },
                    new Model
                    {
                        Name = "A6",
                        Generations =
                        {
                            new Generation
                            {
                                Name = "C8",
                                StartYear = 2018,
                                Variants =
                                {
                                    BuildVariant("45 TFSI", "2.0L I4 Turbo", "Automatic", "Petrol", F, AddFeatures,
                                        new[]{"Air Conditioning","Bluetooth","Cruise Control","Sunroof"})
                                }
                            }
                        }
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
                        Name = "Corolla",
                        Generations =
                        {
                            new Generation
                            {
                                Name = "E210",
                                StartYear = 2018,
                                Variants =
                                {
                                    BuildVariant("1.8 Hybrid", "1.8L I4 Hybrid", "CVT", "Hybrid", F, AddFeatures,
                                        new[]{"Air Conditioning","Bluetooth","ABS"})
                                }
                            }
                        }
                    },
                    new Model
                    {
                        Name = "Camry",
                        Generations =
                        {
                            new Generation
                            {
                                Name = "XV70",
                                StartYear = 2017,
                                Variants =
                                {
                                    BuildVariant("2.5", "2.5L I4", "Automatic", "Petrol", F, AddFeatures,
                                        new[]{"Air Conditioning","Bluetooth","Cruise Control"})
                                }
                            }
                        }
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
                        Name = "Sportage",
                        Generations =
                        {
                            new Generation
                            {
                                Name = "NQ5",
                                StartYear = 2021,
                                Variants =
                                {
                                    BuildVariant("2.0", "2.0L I4", "Automatic", "Petrol", F, AddFeatures,
                                        new[]{"Air Conditioning","Bluetooth"})
                                }
                            }
                        }
                    },
                    new Model
                    {
                        Name = "Sorento",
                        Generations =
                        {
                            new Generation
                            {
                                Name = "MQ4",
                                StartYear = 2020,
                                Variants =
                                {
                                    BuildVariant("2.2D", "2.2L I4 Diesel", "Automatic", "Diesel", F, AddFeatures,
                                        new[]{"Air Conditioning","Bluetooth","Cruise Control"})
                                }
                            }
                        }
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
                        Name = "Focus",
                        Generations =
                        {
                            new Generation
                            {
                                Name = "Mk4",
                                StartYear = 2018,
                                Variants =
                                {
                                    BuildVariant("1.5 EcoBoost", "1.5L I3 Turbo", "Manual", "Petrol", F, AddFeatures,
                                        new[]{"Air Conditioning","Bluetooth","ABS"})
                                }
                            }
                        }
                    },
                    new Model
                    {
                        Name = "Mustang",
                        Generations =
                        {
                            new Generation
                            {
                                Name = "S550",
                                StartYear = 2015,
                                Variants =
                                {
                                    BuildVariant("GT", "5.0L V8", "Manual", "Petrol", F, AddFeatures,
                                        new[]{"Air Conditioning","Bluetooth","Cruise Control","Sunroof"})
                                }
                            }
                        }
                    }
                }
            }
        };

        context.Makes.AddRange(makes);
        context.SaveChanges();

        // local function to construct a variant with features
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
        // after creating makes/models/generations with variants, EF cascade will save with FK ids
    }

    public static void ClearCatalogData(CatalogDbContext context)
    {
        // Remove dependent rows in correct order
        context.VariantFeatures.RemoveRange(context.VariantFeatures);
        context.Variants.RemoveRange(context.Variants);
        context.Generations.RemoveRange(context.Generations);
        context.Models.RemoveRange(context.Models);
        context.Makes.RemoveRange(context.Makes);
        context.SaveChanges();
    }
}
