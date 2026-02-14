using Duende.IdentityModel;
using Duende.IdentityServer.Models;

namespace IdentityService;

public static class Config
{
    public static IEnumerable<IdentityResource> IdentityResources =>
        [
            new IdentityResources.OpenId(),
            new IdentityResources.Profile(),
            new IdentityResources.Email(),
        ];

    public static IEnumerable<ApiScope> ApiScopes =>
        [
            new ApiScope("auctionApp", "Auction App Full Access")
            {
                UserClaims =
                [
                    JwtClaimTypes.Name,
                    JwtClaimTypes.Role,
                    JwtClaimTypes.Email
                ]
            },
            new ApiScope("webClient", "Web Client API Access")
            {
                // Keep claims consistent for the SPA access token
                UserClaims =
                [
                    JwtClaimTypes.Name,
                    JwtClaimTypes.Role,
                    JwtClaimTypes.Email
                ]
            }
        ];

    public static IEnumerable<Client> Clients(IConfiguration config) =>
        [
            new Client
            {
                ClientId = "postman",
                ClientName = "Postman",
                AllowedScopes = { "openid", "profile", "email", "auctionApp" },
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
                AllowedScopes = { "openid", "profile", "email", "auctionApp" },
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
                RedirectUris =
                {
                    config["ClientApp"] ?? "http://localhost:4200",
                    (config["ClientApp"] ?? "http://localhost:4200").TrimEnd('/') + "/"
                },
                PostLogoutRedirectUris =
                {
                    config["ClientApp"] ?? "http://localhost:4200",
                    (config["ClientApp"] ?? "http://localhost:4200").TrimEnd('/') + "/"
                },
                AllowedCorsOrigins =
                {
                    config["ClientApp"] ?? "http://localhost:4200"
                },
                AllowedScopes = { "openid", "profile", "email", "webClient" },
                AllowAccessTokensViaBrowser = true,
                AccessTokenLifetime = 3600,
                AlwaysIncludeUserClaimsInIdToken = true
            }
        ];
}
