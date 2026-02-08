using System.Security.Claims;
using Duende.IdentityModel;
using IdentityService.Models;
using IdentityService.Pages.Account.Register;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace IdentityService.Pages.Register
{
    [SecurityHeaders]
    [AllowAnonymous]
    public class Index(UserManager<ApplicationUser> userManager) : PageModel
    {
        [BindProperty] public RegisterViewModel Input { get; set; } = default!;
        [BindProperty] public bool RegisterSuccess { get; set; }

        public IActionResult OnGet(string returnUrl, string? accountType = null)
        {
            Input = new RegisterViewModel
            {
                ReturnUrl = returnUrl,
                AccountType = accountType
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
                    UserName = Input.Username,
                    Email = Input.Email,
                    EmailConfirmed = true,
                    AccountType = Input.AccountType ?? "Individual"
                };

                var result = await userManager.CreateAsync(user, Input.Password!);

                if (result.Succeeded)
                {
                    await userManager.AddClaimsAsync(user, [
                        new Claim(JwtClaimTypes.Name, Input.FullName!),
                        new Claim(JwtClaimTypes.Role, user.AccountType),
                        new Claim("account_type", user.AccountType)
                    ]);

                    RegisterSuccess = true;
                }
            }

            return Page();
        }
    }
}
