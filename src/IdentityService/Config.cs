using Duende.IdentityServer.Models;

namespace IdentityService;

public static class Config
{
    public static IEnumerable<IdentityResource> IdentityResources =>
        [
            new IdentityResources.OpenId(),
            new IdentityResources.Profile(),
        ];

    public static IEnumerable<ApiScope> ApiScopes =>
        [
            new ApiScope("auctionApp", "Auction App Full Access")
        ];

    public static IEnumerable<Client> Clients(IConfiguration config) =>
        [
            new Client
            {
                ClientId = "postman",
                ClientName = "Postman",
                AllowedScopes = { "openid", "profile", "auctionApp" },
                RedirectUris = { "https://www.getpostman.com/oauth2/callback" },
                ClientSecrets = [new Secret("NotASecret".Sha256())],
                AllowedGrantTypes = { GrantType.ResourceOwnerPassword }
            },
            new Client
            {
                ClientId = "nextApp",
                ClientName = "nextApp",
                ClientSecrets = { new Secret("secret".Sha256()) },
                AllowedGrantTypes = GrantTypes.CodeAndClientCredentials,
                RequirePkce = false,
                RedirectUris = { config["ClientApp"] + "/api/auth/callback/id-server" },
                AllowOfflineAccess = true,
                AllowedScopes = { "openid", "profile", "auctionApp" },
                AccessTokenLifetime = 3600 * 24 * 30,
                AlwaysIncludeUserClaimsInIdToken = true
            },
            new Client
            {
                ClientId = "web-client",
                ClientName = "Angular Web Client",
                AllowedGrantTypes = GrantTypes.Code,
                RequirePkce = true,
                RequireClientSecret = false,
                RedirectUris = { config["ClientApp"] ?? "http://localhost:4200" },
                PostLogoutRedirectUris = { config["ClientApp"] ?? "http://localhost:4200" },
                AllowedCorsOrigins = { config["ClientApp"] ?? "http://localhost:4200" },
                AllowedScopes = { "openid", "profile", "auctionApp" },
                AllowAccessTokensViaBrowser = true,
                AccessTokenLifetime = 3600,
                AlwaysIncludeUserClaimsInIdToken = true
            }
        ];
}
