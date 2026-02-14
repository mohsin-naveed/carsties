using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UserService.Data;
using UserService.Entities;

namespace UserService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfilesController(UserDbContext db) : ControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<UserProfile>> GetMe()
    {
        var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                             ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(identityUserId)) return Unauthorized();

        var identityEmail = User.FindFirstValue(ClaimTypes.Email)
                            ?? User.FindFirstValue("email");

        var profile = await db.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.IdentityUserId == identityUserId);

        if (profile == null)
        {
            // Return a non-error default profile so the SPA can render the create flow
            // without showing a global "Not found" notification.
            return Ok(new UserProfile
            {
                Id = Guid.Empty,
                IdentityUserId = identityUserId,
                Email = identityEmail ?? string.Empty,
                UserType = "Individual",
                DisplayName = null,
                PhoneNumber = null,
                Country = null,
                City = null,
                CompanyName = null,
                CompanyRegistrationNumber = null,
                IsProfileComplete = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        return Ok(profile);
    }

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe()
    {
        var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                             ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(identityUserId)) return Unauthorized();

        var profile = await db.UserProfiles
            .FirstOrDefaultAsync(x => x.IdentityUserId == identityUserId);

        if (profile != null)
        {
            db.UserProfiles.Remove(profile);
            await db.SaveChangesAsync();
        }

        return NoContent();
    }

    public record UpsertMeRequest(
        string Email,
        string UserType,
        string? DisplayName,
        string? PhoneNumber,
        string? Country,
        string? City,
        string? CompanyName,
        string? CompanyRegistrationNumber);

    [HttpPut("me")]
    public async Task<ActionResult<UserProfile>> UpsertMe([FromBody] UpsertMeRequest request)
    {
        var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                             ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(identityUserId)) return Unauthorized();

        var identityEmail = User.FindFirstValue(ClaimTypes.Email)
                            ?? User.FindFirstValue("email");

        var requestedType = NormalizeUserType(request.UserType);
        if (requestedType is not ("Individual" or "Dealer" or "Admin"))
        {
            return BadRequest(new { error = "Invalid userType. Allowed: Individual, Dealer, Admin." });
        }

        // Caller role (from token). IdentityService should only issue role claims.
        var callerRole = User.FindFirstValue(ClaimTypes.Role)
                 ?? User.FindFirstValue("role");
        var isCallerAdmin = string.Equals(callerRole, "Admin", StringComparison.OrdinalIgnoreCase);

        // Prevent privilege escalation: only admins can set Admin.
        if (requestedType == "Admin" && !isCallerAdmin)
        {
            return Forbid();
        }

        var profile = await db.UserProfiles
            .FirstOrDefaultAsync(x => x.IdentityUserId == identityUserId);

        var isNewProfile = profile == null;

        if (profile == null)
        {
            profile = new UserProfile
            {
                Id = Guid.NewGuid(),
                IdentityUserId = identityUserId,
                CreatedAt = DateTime.UtcNow
            };
            db.UserProfiles.Add(profile);
        }

        // UserType rules:
        // - Non-admin users can pick Individual/Dealer on first completion.
        // - Non-admin users cannot change an existing type (prevents switching to influence authZ).
        // - Admin can set/change freely.
        if (!isCallerAdmin)
        {
            if (isNewProfile)
            {
                // First save: allow Individual/Dealer selection.
                profile.UserType = requestedType;
            }
            else
            {
                // Existing profile: ignore attempted type changes.
                requestedType = profile.UserType;
            }
        }

        // Email is owned by IdentityService; prefer token claim to prevent spoofing.
        profile.Email = !string.IsNullOrWhiteSpace(identityEmail) ? identityEmail : request.Email;
        profile.UserType = isCallerAdmin ? requestedType : profile.UserType;
        profile.DisplayName = request.DisplayName;
        profile.PhoneNumber = request.PhoneNumber;
        profile.Country = request.Country;
        profile.City = request.City;
        profile.CompanyName = request.CompanyName;
        profile.CompanyRegistrationNumber = request.CompanyRegistrationNumber;
        profile.IsProfileComplete = ComputeProfileComplete(profile);
        profile.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        return Ok(profile);
    }

    private static string NormalizeUserType(string? userType)
    {
        var v = (userType ?? string.Empty).Trim();
        return v.Length == 0 ? string.Empty : char.ToUpperInvariant(v[0]) + v[1..].ToLowerInvariant();
    }

    private static bool ComputeProfileComplete(UserProfile profile)
    {
        // Rules (per web-client UX):
        // - Individual: UserType + DisplayName
        // - Dealer: UserType + DisplayName + CompanyName
        // Email is required and comes from IdentityService.
        if (string.IsNullOrWhiteSpace(profile.Email)) return false;
        if (string.IsNullOrWhiteSpace(profile.UserType)) return false;
        if (string.IsNullOrWhiteSpace(profile.DisplayName)) return false;

        if (string.Equals(profile.UserType, "Dealer", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(profile.CompanyName)) return false;
        }

        if (string.Equals(profile.UserType, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            // Admin is considered complete with the baseline fields.
            return true;
        }

        return true;
    }
}
