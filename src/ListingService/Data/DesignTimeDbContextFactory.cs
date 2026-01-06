using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ListingService.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ListingDbContext>
{
    public ListingDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ListingDbContext>();
        optionsBuilder.UseNpgsql("Server=localhost;Port=5432;Username=postgres;Password=postgrespw;Database=listing");
        return new ListingDbContext(optionsBuilder.Options);
    }
}