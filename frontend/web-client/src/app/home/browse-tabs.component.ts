import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ListingsApiService } from '../listings/listings-api.service';
import { debounceTime, map, shareReplay } from 'rxjs/operators';
import { BehaviorSubject, combineLatest } from 'rxjs';

@Component({
  selector: 'app-browse-tabs',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatCardModule, MatIconModule],
  templateUrl: './browse-tabs.component.html',
  styleUrls: ['./browse-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrowseTabsComponent {
  private readonly api = inject(ListingsApiService);
  private readonly router = inject(Router);

  // Base facet stream with no filters (initial) - can be extended later
  private readonly facetCounts$ = this.api.getFacetCounts({}).pipe(
    map(dto => ({
      makes: new Map<string, number>(Object.entries(dto.makes)),
      models: new Map<string, number>(Object.entries(dto.models)),
      bodies: new Map<string, number>(Object.entries(dto.bodies)),
      makeLabels: new Map<string, string>(Object.entries(dto.makeLabels ?? {})),
      modelLabels: new Map<string, string>(Object.entries(dto.modelLabels ?? {})),
      bodyLabels: new Map<string, string>(Object.entries(dto.bodyLabels ?? {}))
    })),
    shareReplay(1)
  );

  readonly makes$ = this.facetCounts$.pipe(
    map(fc => Array.from(fc.makeLabels.entries())
      .map(([code, name]) => ({ code, name, count: fc.makes.get(code) ?? 0 }))
      .filter(x => x.count > 0)
      .sort((a,b) => b.count - a.count)
    ),
    shareReplay(1)
  );

  readonly models$ = this.facetCounts$.pipe(
    map(fc => Array.from(fc.modelLabels.entries())
      .map(([code, name]) => ({ code, name, count: fc.models.get(code) ?? 0 }))
      .filter(x => x.count > 0)
      .sort((a,b) => b.count - a.count)
    ),
    shareReplay(1)
  );

  readonly bodies$ = this.facetCounts$.pipe(
    map(fc => Array.from(fc.bodyLabels.entries())
      .map(([code, name]) => ({ code, name, count: fc.bodies.get(code) ?? 0 }))
      .filter(x => x.count > 0)
      .sort((a,b) => b.count - a.count)
    ),
    shareReplay(1)
  );

  goToMake(code: string) { this.router.navigate(['/search'], { queryParams: { makeCodes: [code] } }); }
  goToModel(code: string) { this.router.navigate(['/search'], { queryParams: { modelCodes: [code] } }); }
  goToBody(code: string) { this.router.navigate(['/search'], { queryParams: { bodyTypeCodes: [code] } }); }
}
