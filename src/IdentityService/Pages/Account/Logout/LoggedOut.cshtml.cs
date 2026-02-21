using Duende.IdentityServer.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;

namespace IdentityService.Pages.Logout;

[SecurityHeaders]
[AllowAnonymous]
public class LoggedOut : PageModel
{
    private readonly IIdentityServerInteractionService _interactionService;
    private readonly IConfiguration _configuration;

    public LoggedOutViewModel View { get; set; } = default!;

    public LoggedOut(IIdentityServerInteractionService interactionService, IConfiguration configuration)
    {
        _interactionService = interactionService;
        _configuration = configuration;
    }

    public async Task OnGet(string? logoutId)
    {
        // get context information (client name, post logout redirect URI and iframe for federated signout)
        var logout = await _interactionService.GetLogoutContextAsync(logoutId);

        var clientApp = _configuration["ClientApp"];
        if (!string.IsNullOrWhiteSpace(clientApp))
        {
            clientApp = clientApp.TrimEnd('/') + "/";
        }

        View = new LoggedOutViewModel
        {
            AutomaticRedirectAfterSignOut = LogoutOptions.AutomaticRedirectAfterSignOut,
            PostLogoutRedirectUri = logout?.PostLogoutRedirectUri ?? clientApp,
            ClientName = string.IsNullOrEmpty(logout?.ClientName) ? logout?.ClientId : logout?.ClientName,
            SignOutIframeUrl = logout?.SignOutIFrameUrl
        };
    }
}
