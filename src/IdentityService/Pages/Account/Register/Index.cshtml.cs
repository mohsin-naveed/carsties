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
    public class Index : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public Index(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
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
                        new Claim(JwtClaimTypes.Name, Input.Email ?? string.Empty),
                        // IdentityService should only issue role claims (used for admin authZ)
                        new Claim(JwtClaimTypes.Role, "User")
                    ]);

                    RegisterSuccess = true;
                }
            }

            return Page();
        }
    }
}
