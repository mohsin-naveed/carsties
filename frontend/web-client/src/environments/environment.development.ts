export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5220/api',
  catalogApiBaseUrl: 'http://localhost:7005/api',
  locationApiBaseUrl: 'http://localhost:7010/api',
  userApiBaseUrl: 'http://localhost:7020/api',
  identityAuthority: 'http://localhost:5001',
  identityClientId: 'web-client',
  identityRedirectUrl: 'http://localhost:4300',
  identityPostLogoutRedirectUri: 'http://localhost:4300/',
  identityScope: 'openid profile email webClient offline_access'
};
