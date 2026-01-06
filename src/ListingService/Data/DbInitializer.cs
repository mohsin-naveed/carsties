using ListingService.Entities;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using ListingService.Services;

namespace ListingService.Data;

public class DbInitializer
{
    public static void InitDb(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ListingDbContext>();
        var sync = scope.ServiceProvider.GetRequiredService<CatalogSyncService>();

        if (app.Environment.IsDevelopment())
        {
            ResetDatabase(context);
        }
        try
        {
            context.Database.Migrate();

            // Sync reference data from CatalogService
            sync.SyncReferenceDataAsync(context).GetAwaiter().GetResult();
        }
        catch (Exception ex)
        {
            // In development, avoid crashing the app if DB or Catalog is not ready yet
            Console.WriteLine($"DbInitializer warning: {ex.Message}");
        }
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
}
