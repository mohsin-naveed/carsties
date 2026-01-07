import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { environment } from '../environments/environment.development';
import { apiBaseUrlInterceptor } from './core/api-base-url.interceptor';
import { errorInterceptor } from './core/error.interceptor';
export const appConfig = {
    providers: [
        provideAnimations(),
        provideHttpClient(withInterceptors([
            apiBaseUrlInterceptor(environment.apiBaseUrl),
            errorInterceptor
        ]))
    ]
};
//# sourceMappingURL=app.config.js.map