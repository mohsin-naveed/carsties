using ListingService.Entities;
using Microsoft.EntityFrameworkCore;

namespace ListingService.Data;

public class ListingDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingFeature> ListingFeatures => Set<ListingFeature>();
    

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Listings and features relationship

        modelBuilder.Entity<Listing>(entity =>
        {
            entity.ToTable("Listings");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).IsRequired().HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.Color).HasMaxLength(50);
            entity.Property(x => x.Price).HasColumnType("numeric(18,2)");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");

            // Snapshot columns config
            entity.Property(x => x.MakeName).HasMaxLength(100);
            entity.Property(x => x.ModelName).HasMaxLength(100);
            entity.Property(x => x.GenerationName).HasMaxLength(100);
            entity.Property(x => x.DerivativeName).HasMaxLength(100);
            entity.Property(x => x.VariantName).HasMaxLength(100);
            entity.Property(x => x.BodyTypeName).HasMaxLength(50);
            entity.Property(x => x.TransmissionName).HasMaxLength(50);
            entity.Property(x => x.FuelTypeName).HasMaxLength(50);
            entity.Property(x => x.EngineSnapshot).HasMaxLength(100);
            // JSON snapshot removed in favor of relational ListingFeatures
        });

        modelBuilder.Entity<ListingFeature>(entity =>
        {
            entity.ToTable("ListingFeatures");
            entity.HasKey(x => new { x.ListingId, x.FeatureId });
            entity.HasOne(x => x.Listing).WithMany().HasForeignKey(x => x.ListingId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(x => x.FeatureName).IsRequired().HasMaxLength(100);
            entity.Property(x => x.FeatureDescription).HasMaxLength(250);
        });
    }
}
