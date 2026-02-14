namespace UserService.Entities;

public class UserProfile
{
    public Guid Id { get; set; }

    // Link to IdentityService (AspNet Identity user id)
    public string IdentityUserId { get; set; } = default!;

    // Convenience fields copied from token/identity
    public string Email { get; set; } = default!;

    // Individual | Dealer | Admin
    public string UserType { get; set; } = "Individual";

    // Common profile fields
    public string? DisplayName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }

    // Dealer-only fields
    public string? CompanyName { get; set; }
    public string? CompanyRegistrationNumber { get; set; }

    public bool IsProfileComplete { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
