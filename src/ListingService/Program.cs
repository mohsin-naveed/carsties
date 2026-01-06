using ListingService.Data;
using ListingService.Services;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Polly;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// EF Core - PostgreSQL
builder.Services.AddDbContext<ListingDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// CORS (dev-friendly)
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// AutoMapper
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// Catalog lookup via CatalogService (typed client)

// HttpClient for Catalog API (shared)
void ConfigureCatalogClient(HttpClient client)
{
    var baseUrl = builder.Configuration.GetSection("CatalogApi").GetValue<string>("BaseUrl") ?? "http://localhost:5208/api";
    // Ensure BaseAddress includes '/api' path segment
    var normalized = baseUrl.TrimEnd('/');
    if (!normalized.EndsWith("/api", StringComparison.OrdinalIgnoreCase))
    {
        normalized += "/api";
    }
    client.BaseAddress = new Uri(normalized);
}

// Typed clients
builder.Services.AddHttpClient<CatalogSyncService>(ConfigureCatalogClient);
builder.Services.AddHttpClient<ListingService.Services.CatalogLookup>(ConfigureCatalogClient);
builder.Services.AddScoped<ListingService.Services.ICatalogLookup>(sp => sp.GetRequiredService<ListingService.Services.CatalogLookup>());

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("CorsPolicy");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

// Basic root endpoint to avoid 404 at '/'
app.MapGet("/", () => Results.Ok(new { status = "ListingService running" }));

// Ensure database is created/migrated and sync reference data
var retryPolicy = Policy
    .Handle<NpgsqlException>()
    .WaitAndRetry(5, retryAttempt => TimeSpan.FromSeconds(10));

retryPolicy.ExecuteAndCapture(() => DbInitializer.InitDb(app));

app.Run();