using Microsoft.EntityFrameworkCore;

namespace UserService.Data;

public class DbInitializer
{
    public static void InitDb(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<UserDbContext>();

        // Keep same behavior as other services: apply migrations on start.
        // (We’ll add a dev database reset if you want it later.)
        context.Database.Migrate();
    }
}
