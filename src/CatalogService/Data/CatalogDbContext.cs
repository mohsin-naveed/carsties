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
    public DbSet<VariantFeature> VariantFeatures => Set<VariantFeature>();
    public DbSet<Transmission> Transmissions => Set<Transmission>();
    public DbSet<FuelType> FuelTypes => Set<FuelType>();
    public DbSet<ModelBody> ModelBodies => Set<ModelBody>();
    public DbSet<BodyType> BodyTypes => Set<BodyType>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Make>(entity =>
        {
            entity.ToTable("Makes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<Model>(entity =>
        {
            entity.ToTable("Models");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
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
            entity.HasOne(x => x.ModelBody)
                .WithMany(x => x.Generations)
                .HasForeignKey(x => x.ModelBodyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Variant>(entity =>
        {
            entity.ToTable("Variants");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Engine).HasMaxLength(100);
            entity.HasOne(x => x.Generation)
                .WithMany(x => x.Variants)
                .HasForeignKey(x => x.GenerationId)
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
            entity.Property(x => x.Description).HasMaxLength(250);
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
            entity.ToTable("Transmissions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(50);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<FuelType>(entity =>
        {
            entity.ToTable("FuelTypes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(50);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<BodyType>(entity =>
        {
            entity.ToTable("BodyTypes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(50);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<ModelBody>(entity =>
        {
            entity.ToTable("ModelBodies");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Seats).IsRequired();
            entity.Property(x => x.Doors).IsRequired();
            // Basic range constraints for seats/doors
            entity.HasCheckConstraint("CK_ModelBodies_Seats", "\"Seats\" BETWEEN 2 AND 9");
            entity.HasCheckConstraint("CK_ModelBodies_Doors", "\"Doors\" BETWEEN 2 AND 5");

            entity.HasOne(x => x.Model)
                .WithMany(x => x.ModelBodies)
                .HasForeignKey(x => x.ModelId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.BodyTypeRef)
                .WithMany(x => x.ModelBodies)
                .HasForeignKey(x => x.BodyTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
