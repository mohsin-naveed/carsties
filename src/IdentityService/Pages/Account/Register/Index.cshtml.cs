using System.Security.Claims;
using Duende.IdentityModel;
using IdentityService.Models;
using IdentityService.Pages.Account.Register;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;

namespace IdentityService.Pages.Register
{
    [SecurityHeaders]
    [AllowAnonymous]
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
        [BindProperty] public RegisterViewModel Input { get; set; } = default!;
        [BindProperty] public bool RegisterSuccess { get; set; }

        public IActionResult OnGet(string returnUrl)
        {
            Input = new RegisterViewModel
            {
                ReturnUrl = returnUrl
            };
            return Page();
        }

        public async Task<IActionResult> OnPost()
        {
            if (Input?.Button != "register") return Redirect("~/");

            if (ModelState.IsValid)
            {
                var user = new ApplicationUser
                {
                    UserName = Input.Email,
                    Email = Input.Email,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, Input.Password!);

                if (result.Succeeded)
                {
                    await _userManager.AddClaimsAsync(user, [
                        new Claim(JwtClaimTypes.Name, Input.Email ?? string.Empty)
                    ]);

                    // Create an IdentityServer session cookie so the SPA can immediately do an OIDC authorize redirect.
                    await _signInManager.SignInAsync(user, isPersistent: false);

                    if (IsSafeReturnUrl(Input.ReturnUrl))
                    {
                        return Redirect(Input.ReturnUrl!);
                    }

                    // Fallback: send user back to the configured SPA origin.
                    var clientApp = _config["ClientApp"];
                    if (!string.IsNullOrWhiteSpace(clientApp))
                    {
                        return Redirect(clientApp);
                    }

                    RegisterSuccess = true;
                }
                else
                {
                    foreach (var error in result.Errors)
                    {
                        ModelState.AddModelError(string.Empty, error.Description);
                    }
                }
            }

            return Page();
        }

        private bool IsSafeReturnUrl(string? returnUrl)
        {
            if (string.IsNullOrWhiteSpace(returnUrl)) return false;

            // Allow local urls (rare for this app, but safe).
            if (Url.IsLocalUrl(returnUrl)) return true;

            // Allow only the configured SPA origin.
            var clientApp = _config["ClientApp"];
            if (string.IsNullOrWhiteSpace(clientApp)) return false;

            if (!Uri.TryCreate(clientApp, UriKind.Absolute, out var allowed)) return false;
            if (!Uri.TryCreate(returnUrl, UriKind.Absolute, out var target)) return false;

            return string.Equals(allowed.Scheme, target.Scheme, StringComparison.OrdinalIgnoreCase)
                   && string.Equals(allowed.Host, target.Host, StringComparison.OrdinalIgnoreCase)
                   && allowed.Port == target.Port;
        }
    }
}
