using LocationService.Entities;
using Microsoft.EntityFrameworkCore;

namespace LocationService.Data;

public class LocationDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<Province> Provinces => Set<Province>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<Area> Areas => Set<Area>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Province>(entity =>
        {
            entity.ToTable("Provinces");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(150);
            entity.Property(x => x.Code).IsRequired().HasMaxLength(20);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<City>(entity =>
        {
            entity.ToTable("Cities");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(150);
            entity.Property(x => x.Code).IsRequired().HasMaxLength(20);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.Slug).IsRequired().HasMaxLength(200);
            entity.HasIndex(x => x.Slug);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasOne(x => x.Province)
                .WithMany(p => p.Cities)
                .HasForeignKey(x => x.ProvinceId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Area>(entity =>
        {
            entity.ToTable("Areas");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(200);
            entity.Property(x => x.Code).IsRequired().HasMaxLength(20);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.Slug).IsRequired().HasMaxLength(200);
            entity.HasIndex(x => x.Slug);
            entity.Property(x => x.Latitude).HasColumnType("numeric(10,6)");
            entity.Property(x => x.Longitude).HasColumnType("numeric(10,6)");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasOne(x => x.City)
                .WithMany(c => c.Areas)
                .HasForeignKey(x => x.CityId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
