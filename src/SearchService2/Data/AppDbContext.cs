using Microsoft.EntityFrameworkCore;
using CarSearch.Api.Domain;

namespace CarSearch.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Car> Cars => Set<Car>();
    public DbSet<CarImage> CarImages => Set<CarImage>();
    public DbSet<SliderImage> SliderImages => Set<SliderImage>();
    public DbSet<Feature> Features => Set<Feature>();
    public DbSet<FeatureType> FeatureTypes => Set<FeatureType>();
    public DbSet<ChargeTime> ChargeTimes => Set<ChargeTime>();
    public DbSet<DepositQuote> DepositQuotes => Set<DepositQuote>();
    public DbSet<Tag> Tags => Set<Tag>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Car>(entity =>
        {
            entity.HasKey(e => e.StockNumber);
            entity.Property(e => e.Make).HasMaxLength(100);
            entity.Property(e => e.Model).HasMaxLength(100);
            entity.Property(e => e.Registration).HasMaxLength(20);
            entity.HasMany(e => e.WebsiteImageLinks).WithOne().HasForeignKey(i => i.CarStockNumber).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(e => e.SliderImages).WithOne().HasForeignKey(i => i.CarStockNumber).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(e => e.Features).WithOne().HasForeignKey(f => f.CarStockNumber).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(e => e.AutotraderTaxonomyChargeTimes).WithOne().HasForeignKey(c => c.CarStockNumber).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(e => e.MonthlyPaymentWithDeposit).WithOne().HasForeignKey(d => d.CarStockNumber).OnDelete(DeleteBehavior.Cascade);
            entity
                .HasMany(e => e.Tags)
                .WithMany(t => t.Cars)
                .UsingEntity<Dictionary<string, object>>(
                    "CarTags",
                    j => j.HasOne<Tag>().WithMany().HasForeignKey("TagID").OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<Car>().WithMany().HasForeignKey("CarStockNumber").OnDelete(DeleteBehavior.Cascade));

        entity.HasOne(e => e.PrimaryTag)
            .WithMany() // no inverse navigation to avoid duplication conflict
            .HasForeignKey(e => e.PrimaryTagId)
            .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(t => t.TagID);
            entity.Property(t => t.TagID).ValueGeneratedNever();
        });

        modelBuilder.Entity<Feature>(entity =>
        {
            entity.HasOne(f => f.FeatureType).WithMany().HasForeignKey(ft => ft.StockFeatureTypeID).HasPrincipalKey(ft => ft.StockFeatureTypeID);
        });
    }
}