import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class BackendHealthService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);

  private lastUserServiceDownAt = 0;
  private readonly cooldownMs = 10_000;

  private get userServiceRoot(): string {
    // environment.userApiBaseUrl is expected to be like http://host:port/api
    return environment.userApiBaseUrl.replace(/\/api\/?$/, '');
  }

  isUserServiceUrl(url: string): boolean {
    return url.startsWith(environment.userApiBaseUrl) || url.startsWith(this.userServiceRoot);
  }

  pingUserService(): void {
    // Root endpoint is unauthenticated and cheap. This is a non-blocking hint for dev.
    this.http.get(`${this.userServiceRoot}/`).subscribe({
      next: () => undefined,
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 0) {
          this.notifyUserServiceDown();
        }
      }
    });
  }

  notifyUserServiceDown(): void {
    const now = Date.now();
    if (now - this.lastUserServiceDownAt < this.cooldownMs) return;
    this.lastUserServiceDownAt = now;

    this.notify.error(`UserService is not reachable (${this.userServiceRoot}). Start it and refresh.`);
  }
}
