using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.Entities;

namespace UserService.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController(UserDbContext db) : ControllerBase
{
    public record CreateAdminRequest(
        string IdentityUserId,
        string Email,
        string DisplayName,
        string PhoneNumber,
        string? Country,
        string? City);

    [HttpPost("profiles")]
    public async Task<ActionResult<UserProfile>> CreateAdminProfile([FromBody] CreateAdminRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.IdentityUserId)) return BadRequest(new { error = "IdentityUserId is required" });
        if (string.IsNullOrWhiteSpace(request.Email)) return BadRequest(new { error = "Email is required" });
        if (string.IsNullOrWhiteSpace(request.DisplayName)) return BadRequest(new { error = "DisplayName is required" });
        if (string.IsNullOrWhiteSpace(request.PhoneNumber)) return BadRequest(new { error = "PhoneNumber is required" });

        var existing = await db.UserProfiles.FirstOrDefaultAsync(x => x.IdentityUserId == request.IdentityUserId);
        if (existing != null) return Conflict(new { error = "Profile already exists for this IdentityUserId" });

        var profile = new UserProfile
        {
            Id = Guid.NewGuid(),
            IdentityUserId = request.IdentityUserId,
            Email = request.Email,
            UserType = "Admin",
            DisplayName = request.DisplayName,
            PhoneNumber = request.PhoneNumber,
            Country = request.Country,
            City = request.City,
            IsProfileComplete = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.UserProfiles.Add(profile);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAdminProfile), new { identityUserId = profile.IdentityUserId }, profile);
    }

    [HttpGet("profiles/{identityUserId}")]
    public async Task<ActionResult<UserProfile>> GetAdminProfile(string identityUserId)
    {
        var profile = await db.UserProfiles.AsNoTracking().FirstOrDefaultAsync(x => x.IdentityUserId == identityUserId);
        if (profile == null) return NotFound();
        return Ok(profile);
    }
}
