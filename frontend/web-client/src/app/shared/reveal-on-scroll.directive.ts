import { Directive, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Adds a lightweight "fade-up" reveal effect when the element scrolls into view.
 *
 * UI-only enhancement:
 * - IntersectionObserver runs only in the browser.
 * - Respects prefers-reduced-motion via CSS (see `src/styles.scss`).
 */
@Directive({
  selector: '[appRevealOnScroll]',
  standalone: true
})
export class RevealOnScrollDirective implements OnInit, OnDestroy {
  private observer?: IntersectionObserver;

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const element = this.el.nativeElement;
    element.classList.add('reveal');

    // If IntersectionObserver isn't available, just show content.
    if (typeof IntersectionObserver === 'undefined') {
      element.classList.add('reveal--visible');
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).classList.add('reveal--visible');
          this.observer?.unobserve(entry.target);
        }
      },
      { root: null, threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
