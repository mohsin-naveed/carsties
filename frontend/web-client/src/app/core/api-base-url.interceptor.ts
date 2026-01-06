import { HttpInterceptorFn } from '@angular/common/http';

export const apiBaseUrlInterceptor = (baseUrl: string): HttpInterceptorFn => {
  const normalized = baseUrl.replace(/\/$/, '');
  return (req, next) => {
    const isAbsolute = /^https?:\/\//i.test(req.url);
    if (isAbsolute || req.url.startsWith('/assets')) return next(req);
    const trimmed = req.url.replace(/^\//, '');
    const url = `${normalized}/${trimmed}`;
    const collapsed = url.replace(/\/api\/api\//, '/api/');
    return next(req.clone({ url: collapsed }));
  };
};