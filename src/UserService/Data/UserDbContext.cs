using Microsoft.EntityFrameworkCore;
using UserService.Entities;

namespace UserService.Data;

public class UserDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.ToTable("UserProfiles");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.UserId)
                .IsRequired()
                .HasMaxLength(64);
            entity.HasIndex(x => x.UserId).IsUnique();

            entity.Property(x => x.Email)
                .IsRequired()
                .HasMaxLength(256);
            entity.HasIndex(x => x.Email);

            entity.Property(x => x.UserType)
                .IsRequired()
                .HasMaxLength(32);

            entity.Property(x => x.DisplayName)
                .HasMaxLength(200);

            entity.Property(x => x.PhoneNumber)
                .HasMaxLength(32);

            entity.Property(x => x.Country)
                .HasMaxLength(100);
            entity.Property(x => x.City)
                .HasMaxLength(100);

            // Dealer fields
            entity.Property(x => x.CompanyName)
                .HasMaxLength(200);
            entity.Property(x => x.CompanyRegistrationNumber)
                .HasMaxLength(100);

            entity.Property(x => x.IsProfileComplete)
                .HasDefaultValue(false);

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("now() at time zone 'utc'");
            entity.Property(x => x.UpdatedAt)
                .HasDefaultValueSql("now() at time zone 'utc'");
        });
    }
}
