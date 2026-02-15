using System.Security.Claims;
using Duende.IdentityModel;
using IdentityService.Data;
using IdentityService.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Serilog;

namespace IdentityService;

public class SeedData
{
    public static void EnsureSeedData(WebApplication app)
    {
        using var scope = app.Services.GetRequiredService<IServiceScopeFactory>().CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (app.Environment.IsDevelopment())
        {
            var resetRequested = string.Equals(Environment.GetEnvironmentVariable("RESET_DB"), "true", StringComparison.OrdinalIgnoreCase);
            if (resetRequested)
            {
                ResetDatabase(context);
            }
        }

        context.Database.Migrate();

        var userMgr = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        if (userMgr.Users.Any()) return;

        var alice = userMgr.FindByNameAsync("alice").Result;
        if (alice == null)
        {
            alice = new ApplicationUser
            {
                UserName = "alice",
                Email = "AliceSmith@example.com",
                EmailConfirmed = true
            };
            var result = userMgr.CreateAsync(alice, "Pass123$").Result;
            if (!result.Succeeded)
            {
                throw new Exception(result.Errors.First().Description);
            }

            result = userMgr.AddClaimsAsync(alice, [
                            new Claim(JwtClaimTypes.Name, "Alice Smith")
                        ]).Result;
            if (!result.Succeeded)
            {
                throw new Exception(result.Errors.First().Description);
            }
            Log.Debug("alice created");
        }
        else
        {
            Log.Debug("alice already exists");
        }

        var bob = userMgr.FindByNameAsync("bob").Result;
        if (bob == null)
        {
            bob = new ApplicationUser
            {
                UserName = "bob",
                Email = "BobSmith@example.com",
                EmailConfirmed = true
            };
            var result = userMgr.CreateAsync(bob, "Pass123$").Result;
            if (!result.Succeeded)
            {
                throw new Exception(result.Errors.First().Description);
            }

            result = userMgr.AddClaimsAsync(bob, [
                            new Claim(JwtClaimTypes.Name, "Bob Smith")
                        ]).Result;
            if (!result.Succeeded)
            {
                throw new Exception(result.Errors.First().Description);
            }
            Log.Debug("bob created");
        }
        else
        {
            Log.Debug("bob already exists");
        }
    }

    private static void ResetDatabase(ApplicationDbContext context)
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
