using ListingService.Entities;
using Microsoft.EntityFrameworkCore;

namespace ListingService.Data;

public class ListingDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingFeature> ListingFeatures => Set<ListingFeature>();
    public DbSet<ListingImage> ListingImages => Set<ListingImage>();
    

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

            // BatteryKWh now maps to a column of the same name (see migration)

            // Snapshot columns config
            entity.Property(x => x.MakeName).HasMaxLength(100);
            entity.Property(x => x.ModelName).HasMaxLength(100);
            entity.Property(x => x.GenerationName).HasMaxLength(100);
            entity.Property(x => x.DerivativeName).HasMaxLength(100);
            entity.Property(x => x.VariantName).HasMaxLength(100);
            entity.Property(x => x.BodyTypeName).HasMaxLength(50);
            entity.Property(x => x.TransmissionTypeName).HasMaxLength(50);
            entity.Property(x => x.FuelTypeName).HasMaxLength(50);

            // Code snapshots
            entity.Property(x => x.MakeCode).HasMaxLength(120);
            entity.Property(x => x.ModelCode).HasMaxLength(120);
            entity.Property(x => x.GenerationCode).HasMaxLength(120);
            entity.Property(x => x.BodyTypeCode).HasMaxLength(100);
            entity.Property(x => x.TransmissionTypeCode).HasMaxLength(100);
            entity.Property(x => x.FuelTypeCode).HasMaxLength(50);
            entity.Property(x => x.DerivativeCode).HasMaxLength(120);
            entity.Property(x => x.VariantCode).HasMaxLength(120);
            // JSON snapshot removed in favor of relational ListingFeatures

            entity.HasMany(x => x.Images)
                .WithOne(i => i.Listing)
                .HasForeignKey(i => i.ListingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ListingFeature>(entity =>
        {
            entity.ToTable("ListingFeatures");
            entity.HasKey(x => new { x.ListingId, x.FeatureCode });
            entity.HasOne(x => x.Listing).WithMany().HasForeignKey(x => x.ListingId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(x => x.FeatureCode).IsRequired().HasMaxLength(50);
            entity.Property(x => x.FeatureName).IsRequired().HasMaxLength(100);
            entity.Property(x => x.FeatureDescription).HasMaxLength(250);
            entity.Property(x => x.FeatureCategoryName).HasMaxLength(100);
            entity.Property(x => x.FeatureCategoryCode).HasMaxLength(50);
        });

        modelBuilder.Entity<ListingImage>(entity =>
        {
            entity.ToTable("ListingImages");
            entity.HasKey(x => x.Id);
            entity.HasOne(x => x.Listing).WithMany(l => l.Images).HasForeignKey(x => x.ListingId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(x => x.FileName).IsRequired().HasMaxLength(200);
            entity.Property(x => x.Url).IsRequired().HasMaxLength(500);
            entity.Property(x => x.ThumbUrl).HasMaxLength(500);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
        });
    }
}
