import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Global error handlers to improve runtime diagnostics during development
if (typeof window !== 'undefined') {
  window.addEventListener('error', (ev) => {
    try {
      const info = ev.error || ev.message || ev;
      const stack = (ev as any).error?.stack || (ev as any).stack;
      // eslint-disable-next-line no-console
      console.error('[RuntimeError] uncaught error:', info, {
        stack,
        filename: (ev as any).filename,
        lineno: (ev as any).lineno,
      });
    } catch {}
  });
  window.addEventListener('unhandledrejection', (ev) => {
    try {
      const reason = ev.reason || ev;
      const stack = (ev as any)?.reason?.stack || (ev as any)?.stack;
      // eslint-disable-next-line no-console
      console.error('[RuntimeError] unhandledrejection:', reason, { stack });
    } catch {}
  });
}

bootstrapApplication(App, appConfig).catch((err) => console.error('[BootstrapError]', err));
