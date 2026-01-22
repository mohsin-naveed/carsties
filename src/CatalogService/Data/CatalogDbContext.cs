using CatalogService.Entities;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Data;

public class CatalogDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<Make> Makes => Set<Make>();
    public DbSet<Model> Models => Set<Model>();
    public DbSet<Generation> Generations => Set<Generation>();
    public DbSet<Variant> Variants => Set<Variant>();
    public DbSet<Feature> Features => Set<Feature>();
    public DbSet<FeatureCategory> FeatureCategories => Set<FeatureCategory>();
    public DbSet<VariantFeature> VariantFeatures => Set<VariantFeature>();
    public DbSet<Transmission> Transmissions => Set<Transmission>();
    public DbSet<FuelType> FuelTypes => Set<FuelType>();
    public DbSet<Derivative> Derivatives => Set<Derivative>();
    public DbSet<BodyType> BodyTypes => Set<BodyType>();
    public DbSet<Entities.DriveType> DriveTypes => Set<Entities.DriveType>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Make>(entity =>
        {
            entity.ToTable("Makes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Code).IsRequired().HasMaxLength(100);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.Country).HasMaxLength(100);
            entity.Property(x => x.IsActive).HasDefaultValue(true);
            entity.Property(x => x.IsPopular).HasDefaultValue(false);
            entity.Property(x => x.Slug).IsRequired().HasMaxLength(120);
            entity.HasIndex(x => x.Slug).IsUnique();
        });

        modelBuilder.Entity<Model>(entity =>
        {
            entity.ToTable("Models");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Code).IsRequired().HasMaxLength(100);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.IsActive).HasDefaultValue(true);
            entity.Property(x => x.IsPopular).HasDefaultValue(false);
            entity.Property(x => x.Slug).IsRequired().HasMaxLength(120);
            entity.HasIndex(x => x.Slug).IsUnique();
            entity.HasOne(x => x.Make)
                .WithMany(x => x.Models)
                .HasForeignKey(x => x.MakeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Generation>(entity =>
        {
            entity.ToTable("Generations");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Code).IsRequired().HasMaxLength(120);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.HasOne(x => x.Model)
                .WithMany(x => x.Generations)
                .HasForeignKey(x => x.ModelId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Variant>(entity =>
        {
            entity.ToTable("Variants");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Code).IsRequired().HasMaxLength(150);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.IsPopular).HasDefaultValue(false);
            entity.Property(x => x.IsImported).HasDefaultValue(false);
            entity.Property(x => x.Engine).HasMaxLength(100);
            entity.HasOne(x => x.Derivative)
                .WithMany()
                .HasForeignKey(x => x.DerivativeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.TransmissionRef)
                .WithMany()
                .HasForeignKey(x => x.TransmissionId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.FuelTypeRef)
                .WithMany()
                .HasForeignKey(x => x.FuelTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Feature>(entity =>
        {
            entity.ToTable("Features");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Code).IsRequired().HasMaxLength(120);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.Slug).IsRequired().HasMaxLength(120);
            entity.HasIndex(x => x.Slug).IsUnique();
            entity.Property(x => x.Description).HasMaxLength(250);
            entity.HasOne(x => x.Category)
                .WithMany(c => c.Features)
                .HasForeignKey(x => x.FeatureCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<VariantFeature>(entity =>
        {
            entity.ToTable("VariantFeatures");
            entity.HasKey(x => new { x.VariantId, x.FeatureId });
            entity.Property(x => x.IsStandard).HasDefaultValue(true);
            entity.Property(x => x.AddedDate).HasDefaultValueSql("now()");

            entity.HasOne(x => x.Variant)
                .WithMany(x => x.VariantFeatures)
                .HasForeignKey(x => x.VariantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Feature)
                .WithMany(x => x.VariantFeatures)
                .HasForeignKey(x => x.FeatureId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Transmission>(entity =>
        {
            // Rename table to TransmissionType
            entity.ToTable("TransmissionType");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(50);
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Code).IsRequired().HasMaxLength(100);
            entity.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<FuelType>(entity =>
        {
            entity.ToTable("FuelTypes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(50);
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<BodyType>(entity =>
        {
            entity.ToTable("BodyTypes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(50);
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Code).IsRequired().HasMaxLength(100);
            entity.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<Derivative>(entity =>
        {
            entity.ToTable("Derivatives");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Code).IsRequired().HasMaxLength(150);
            entity.HasIndex(x => x.Code).IsUnique();
            // Enforce unique name within a Generation
            entity.HasIndex(x => new { x.GenerationId, x.Name }).IsUnique();
            entity.Property(x => x.Seats).IsRequired();
            entity.Property(x => x.Doors).IsRequired();
            entity.HasCheckConstraint("CK_Derivatives_Seats", "\"Seats\" BETWEEN 2 AND 9");
            entity.HasCheckConstraint("CK_Derivatives_Doors", "\"Doors\" BETWEEN 2 AND 5");
            entity.Property(x => x.EngineCC);
            entity.Property(x => x.EngineL);
            entity.Property(x => x.BatteryKWh);
            entity.Property(x => x.IsActive).HasDefaultValue(true);

            entity.HasOne(x => x.Model)
                .WithMany(x => x.Derivatives)
                .HasForeignKey(x => x.ModelId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Generation)
                .WithMany()
                .HasForeignKey(x => x.GenerationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.BodyTypeRef)
                .WithMany(x => x.Derivatives)
                .HasForeignKey(x => x.BodyTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.DriveTypeRef)
                .WithMany()
                .HasForeignKey(x => x.DriveTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.TransmissionRef)
                .WithMany()
                .HasForeignKey(x => x.TransmissionId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.FuelTypeRef)
                .WithMany()
                .HasForeignKey(x => x.FuelTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Entities.DriveType>(entity =>
        {
            entity.ToTable("DriveTypes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).IsRequired().HasMaxLength(10);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");
        });
        modelBuilder.Entity<FeatureCategory>(entity =>
        {
            entity.ToTable("FeatureCategories");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");
        });
    }
}
