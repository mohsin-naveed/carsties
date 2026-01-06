using ListingService.Entities;
using Microsoft.EntityFrameworkCore;

namespace ListingService.Data;

public class ListingDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<Make> Makes => Set<Make>();
    public DbSet<Model> Models => Set<Model>();
    public DbSet<Generation> Generations => Set<Generation>();
    public DbSet<Derivative> Derivatives => Set<Derivative>();
    public DbSet<Variant> Variants => Set<Variant>();
    public DbSet<Transmission> Transmissions => Set<Transmission>();
    public DbSet<FuelType> FuelTypes => Set<FuelType>();
    public DbSet<BodyType> BodyTypes => Set<BodyType>();
    public DbSet<Feature> Features => Set<Feature>();

    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingFeature> ListingFeatures => Set<ListingFeature>();

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
            entity.HasOne(x => x.Model)
                .WithMany(x => x.Generations)
                .HasForeignKey(x => x.ModelId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Derivative>(entity =>
        {
            entity.ToTable("Derivatives");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Seats).IsRequired();
            entity.Property(x => x.Doors).IsRequired();
            entity.Property(x => x.Engine).HasMaxLength(100);

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

            entity.HasOne(x => x.TransmissionRef)
                .WithMany()
                .HasForeignKey(x => x.TransmissionId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.FuelTypeRef)
                .WithMany()
                .HasForeignKey(x => x.FuelTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Variant>(entity =>
        {
            entity.ToTable("Variants");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
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

        modelBuilder.Entity<Feature>(entity =>
        {
            entity.ToTable("Features");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Description).HasMaxLength(250);
            entity.HasIndex(x => x.Name).IsUnique();
        });

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
            entity.Property(x => x.VariantFeaturesJson).HasColumnType("jsonb");
            entity.Property(x => x.VariantFeaturesJson).HasColumnType("jsonb");

            entity.HasOne<Make>().WithMany().HasForeignKey(x => x.MakeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Model>().WithMany().HasForeignKey(x => x.ModelId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Generation>().WithMany().HasForeignKey(x => x.GenerationId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Derivative>().WithMany().HasForeignKey(x => x.DerivativeId).OnDelete(DeleteBehavior.Restrict);
            // Bind to navigation to avoid shadow FK (VariantId1)
            entity.HasOne(x => x.Variant).WithMany().HasForeignKey(x => x.VariantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Transmission>().WithMany().HasForeignKey(x => x.TransmissionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<FuelType>().WithMany().HasForeignKey(x => x.FuelTypeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<BodyType>().WithMany().HasForeignKey(x => x.BodyTypeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ListingFeature>(entity =>
        {
            entity.ToTable("ListingFeatures");
            entity.HasKey(x => new { x.ListingId, x.FeatureId });
            entity.HasOne(x => x.Feature).WithMany().HasForeignKey(x => x.FeatureId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<Listing>().WithMany(x => x.Features).HasForeignKey(x => x.ListingId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
