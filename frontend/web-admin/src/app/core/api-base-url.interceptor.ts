import { HttpInterceptorFn } from '@angular/common/http';

// Single implementation: prefix relative API calls with provided base URL, skipping absolute URLs and asset requests.
export const apiBaseUrlInterceptor = (baseUrl: string): HttpInterceptorFn => {
  const normalized = baseUrl.replace(/\/$/, '');
  return (req, next) => {
    const isAbsolute = /^https?:\/\//i.test(req.url);
    if (isAbsolute || req.url.startsWith('/assets')) return next(req);
    const trimmed = req.url.replace(/^\//, '');
    const url = `${normalized}/${trimmed}`;
    // Avoid double /api/api if baseUrl already includes /api and request also starts with api
    const collapsed = url.replace(/\/api\/api\//, '/api/');
    return next(req.clone({ url: collapsed }));
  };
};
