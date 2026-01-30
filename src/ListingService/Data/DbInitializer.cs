using ListingService.Entities;
using Microsoft.EntityFrameworkCore;
using Npgsql;
// Catalog lookup removed; seeding does not rely on external services

namespace ListingService.Data;

public class DbInitializer
{
    public static void InitDb(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ListingDbContext>();
        if (app.Environment.IsDevelopment())
        {
            var resetRequested = string.Equals(Environment.GetEnvironmentVariable("RESET_DB"), "true", StringComparison.OrdinalIgnoreCase);
            if (resetRequested)
            {
                ResetDatabase(context);
            }
            context.Database.Migrate();
            // Seed minimal demo data when empty (dev only)
            try
            {
                SeedIfEmpty(context);
            }
            catch
            {
                // best-effort; ignore seeding failures in dev
            }
            return;
        }
        // In non-dev, apply migrations (no destructive reset)
        context.Database.Migrate();
    }

    private static void ResetDatabase(ListingDbContext context)
    {
        var cs = context.Database.GetConnectionString();
        if (string.IsNullOrEmpty(cs)) return;
        var builder = new NpgsqlConnectionStringBuilder(cs);
        var targetDb = builder.Database;
        builder.Database = "postgres";
        using var conn = new NpgsqlConnection(builder.ConnectionString);
        conn.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{targetDb}' AND pid <> pg_backend_pid();";
        cmd.ExecuteNonQuery();
        cmd.CommandText = $"DROP DATABASE IF EXISTS \"{targetDb}\";";
        cmd.ExecuteNonQuery();
        cmd.CommandText = $"CREATE DATABASE \"{targetDb}\";";
        cmd.ExecuteNonQuery();
        conn.Close();
    }

    private static void SeedIfEmpty(ListingDbContext context)
    {
        if (context.Listings.Any()) return;

        var demo = new Listing
        {
            Title = "Demo Car 1",
            Description = "Seeded demo listing",
            Year = 2020,
            Mileage = 25000,
            Price = 15000m,
            Color = "Blue",
            MakeCode = "DEMO-MAKE",
            MakeName = "Demo Make",
            ModelCode = "DEMO-MODEL",
            ModelName = "Demo Model",
            GenerationCode = "DEMO-GEN",
            GenerationName = "Gen 1",
            DerivativeCode = "DEMO-DER",
            DerivativeName = "Derivative",
            VariantCode = "DEMO-VAR",
            VariantName = "Variant",
            BodyTypeCode = "SEDAN",
            BodyTypeName = "Sedan",
            TransmissionTypeCode = "AUTO",
            TransmissionTypeName = "Automatic",
            FuelTypeCode = "PETROL",
            FuelTypeName = "Petrol",
            Seats = 5,
            Doors = 4,
            EngineSizeCC = 1998,
            EngineSizeL = 2.0m,
            BatteryKWh = null
        };

        context.Listings.Add(demo);
        context.SaveChanges();
    }
}
