using Microsoft.EntityFrameworkCore;
using CarSearch.Api.Data;
using CarSearch.Api.Services;
using Microsoft.AspNetCore.Mvc;


var builder = WebApplication.CreateBuilder(args);


// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS policy to allow all origins
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod()
    );
});

// Configure EF Core with SQLite (local file). For sample static JSON endpoint only minimal context is required.
var connectionString = builder.Configuration.GetConnectionString("Default") ?? "Data Source=carsearch.db";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

// Add custom services
builder.Services.AddScoped<IFilterOptionsService, FilterOptionsService>();


var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use CORS policy
app.UseCors("AllowAll");

app.UseHttpsRedirection();

// Optionally add global route prefix versioning later; keep minimal now.
app.MapControllers();

// Basic liveness endpoint
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy" }))
    .WithName("HealthCheck")
    .WithOpenApi();

// Seed database minimally from static JSON if empty
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DataSeeder");
    // Apply migrations (best practice vs EnsureCreated for evolving schema)
    await db.Database.MigrateAsync();
    await DataSeeder.SeedAsync(db, app.Environment, logger);
}

app.Run();
