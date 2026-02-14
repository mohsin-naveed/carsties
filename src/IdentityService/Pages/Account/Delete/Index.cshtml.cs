using IdentityService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IdentityService.Pages.Account.Delete;

[SecurityHeaders]
[Authorize]
public class Index : PageModel
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _config;

    public Index(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration config)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _config = config;
    }

    public async Task<IActionResult> OnGet(string? returnUrl)
    {
        // If user isn't actually authenticated, just bounce back.
        if (User.Identity?.IsAuthenticated != true)
        {
            return Redirect(GetFallbackReturnUrl(returnUrl));
        }

        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            await _signInManager.SignOutAsync();
            return Redirect(GetFallbackReturnUrl(returnUrl));
        }

        // Delete identity user (and related Identity tables via cascade rules).
        var result = await _userManager.DeleteAsync(user);

        // Always sign out cookie afterwards.
        await _signInManager.SignOutAsync();

        // Even if delete failed, redirect back to SPA home.
        return Redirect(GetFallbackReturnUrl(returnUrl));
    }

    private string GetFallbackReturnUrl(string? requestedReturnUrl)
    {
        if (IsSafeReturnUrl(requestedReturnUrl)) return requestedReturnUrl!;

        var clientApp = _config["ClientApp"];
        if (!string.IsNullOrWhiteSpace(clientApp))
        {
            return clientApp.TrimEnd('/') + "/";
        }

        return "/";
    }

    private bool IsSafeReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl)) return false;

        if (Url.IsLocalUrl(returnUrl)) return true;

        var clientApp = _config["ClientApp"];
        if (string.IsNullOrWhiteSpace(clientApp)) return false;

        if (!Uri.TryCreate(clientApp, UriKind.Absolute, out var allowed)) return false;
        if (!Uri.TryCreate(returnUrl, UriKind.Absolute, out var target)) return false;

        return string.Equals(allowed.Scheme, target.Scheme, StringComparison.OrdinalIgnoreCase)
               && string.Equals(allowed.Host, target.Host, StringComparison.OrdinalIgnoreCase)
               && allowed.Port == target.Port;
    }
}
