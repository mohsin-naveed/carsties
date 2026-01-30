using LocationService.Entities;
using LocationService.RequestHelpers;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace LocationService.Data;

public class DbInitializer
{
    public static void InitDb(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LocationDbContext>();
        if (app.Environment.IsDevelopment())
        {
            ResetDatabase(context);
        }
        context.Database.Migrate();

        if (context.Database.GetAppliedMigrations().Any())
        {
            SeedPakistanLocations(context);
        }
    }

    private static void ResetDatabase(LocationDbContext context)
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

    private static void SeedPakistanLocations(LocationDbContext ctx)
    {
        if (ctx.Provinces.Any()) return; // deterministic, only seed once

        var provinces = new List<Province>
        {
            new() { Name = "Punjab", Code = "" },
            new() { Name = "Sindh", Code = "" },
            new() { Name = "Khyber Pakhtunkhwa", Code = "" },
            new() { Name = "Balochistan", Code = "" },
            new() { Name = "Islamabad Capital Territory", Code = "" }
        };

        // Assign province codes sequentially PR-XXXX
        var prSeq = 1;
        foreach (var p in provinces)
        {
            p.Code = $"PR-{prSeq:0000}";
            p.CreatedAt = DateTime.UtcNow;
            p.UpdatedAt = DateTime.UtcNow;
            prSeq++;
        }
        ctx.Provinces.AddRange(provinces);
        ctx.SaveChanges();

        var provinceMap = ctx.Provinces.ToDictionary(p => p.Name, p => p.Id);

        // Cities under each province
        var citySeed = new List<(string Province, string City)>
        {
            ("Punjab", "Lahore"),
            ("Punjab", "Rawalpindi"),
            ("Punjab", "Faisalabad"),
            ("Sindh", "Karachi"),
            ("Sindh", "Hyderabad"),
            ("Khyber Pakhtunkhwa", "Peshawar"),
            ("Khyber Pakhtunkhwa", "Abbottabad"),
            ("Balochistan", "Quetta"),
            ("Islamabad Capital Territory", "Islamabad")
        };

        var cities = new List<City>();
        var ctSeq = 1;
        foreach (var (prov, cityName) in citySeed)
        {
            var c = new City
            {
                ProvinceId = provinceMap[prov],
                Name = cityName,
                Code = $"CT-{ctSeq:0000}",
                Slug = SlugGenerator.FromName(cityName),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            cities.Add(c);
            ctSeq++;
        }
        ctx.Cities.AddRange(cities);
        ctx.SaveChanges();

        var cityMap = ctx.Cities.ToDictionary(c => c.Name, c => c.Id);

        // Areas under some key cities (representative, deterministic)
        var areaSeed = new List<(string City, string Area)>
        {
            ("Lahore", "DHA Phase 5"),
            ("Lahore", "Gulberg"),
            ("Lahore", "Johar Town"),
            ("Karachi", "Bahria Town Karachi"),
            ("Karachi", "Gulshan-e-Iqbal"),
            ("Islamabad", "F-7"),
            ("Islamabad", "G-11"),
            ("Peshawar", "University Town"),
            ("Quetta", "Sariab Road")
        };

        var areas = new List<Area>();
        var arSeq = 1;
        foreach (var (cityName, areaName) in areaSeed)
        {
            var a = new Area
            {
                CityId = cityMap[cityName],
                Name = areaName,
                Code = $"AR-{arSeq:0000}",
                Slug = SlugGenerator.FromName(areaName),
                Latitude = null,
                Longitude = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            areas.Add(a);
            arSeq++;
        }
        ctx.Areas.AddRange(areas);
        ctx.SaveChanges();
    }
}
