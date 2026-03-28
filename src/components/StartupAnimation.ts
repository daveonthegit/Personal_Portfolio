/** System bar target widths as % of `.xiaoos-sys-blocks` (matches 30/140/180 of 220px design). */
const SYS_BAR = {
  b1: '13.636363%',
  b2: '63.636363%',
  b3: '81.818181%',
} as const;

type StyleValue = number | string;
type AnimatableTarget = string | HTMLElement | null;

interface AnimationOptions {
  delayMs?: number;
  easing?: string;
  staggerMs?: number;
  iterations?: number;
  direction?: PlaybackDirection;
}

/**
 * Terminal Startup Animation Component
 * xiaoOS style loading sequence
 */
export class StartupAnimation {
  private container: HTMLElement | null = null;
  private isAnimating = false;

  constructor() {
    this.init();
  }

  private init(): void {
    this.createAnimationContainer();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.setTimeout(() => this.redirectToHome(), 220);
      return;
    }

    void this.startAnimation();
  }

  private createAnimationContainer(): void {
    const markup = `
      <div class="xiaoos-display-area" id="xiaoos-display-area">

          <div class="xiaoos-x-grid" id="xiaoos-x-grid"></div>

          <div class="xiaoos-strike-bars" id="xiaoos-strike-bars">
              <div class="xiaoos-strike-bar"></div>
              <div class="xiaoos-strike-bar"></div>
              <div class="xiaoos-strike-bar"></div>
          </div>

          <div class="xiaoos-transition-diamond" id="xiaoos-transition-diamond">
              <div class="xiaoos-diamond-shape" id="xiaoos-diamond-shape"></div>
              <div class="xiaoos-diamond-x-lines" id="xiaoos-diamond-x-lines">
                  <div class="xiaoos-x-line xiaoos-x-line-1"></div>
                  <div class="xiaoos-x-line xiaoos-x-line-2"></div>
              </div>
          </div>

          <div class="xiaoos-shape-container" id="xiaoos-shape-container">
              <svg class="xiaoos-shape-1" viewBox="0 0 150 150">
                  <polygon points="75,10 140,75 75,140 10,75" class="xiaoos-shape-path" />
              </svg>

              <svg class="xiaoos-shape-2" viewBox="0 0 150 150">
                  <polygon points="75,10 140,75 75,140 10,75" class="xiaoos-shape-path" />
                  <polygon points="10,50 140,50 75,140" class="xiaoos-shape-path" />
              </svg>

              <svg class="xiaoos-shape-3" viewBox="0 0 150 150">
                  <polygon points="75,10 140,75 75,140 10,75" class="xiaoos-shape-path" />
                  <circle cx="75" cy="75" r="45" class="xiaoos-shape-path" />
              </svg>

              <svg class="xiaoos-shape-4" viewBox="0 0 150 150">
                  <circle cx="75" cy="75" r="45" class="xiaoos-shape-path" />
                  <polygon points="10,50 140,50 75,140" class="xiaoos-shape-path" />
              </svg>

              <svg class="xiaoos-shape-5" viewBox="0 0 150 150">
                  <circle cx="75" cy="75" r="45" class="xiaoos-shape-path" />
                  <polygon points="10,50 140,50 75,140" class="xiaoos-shape-path" />
                  <polygon points="75,50 105,95 45,95" class="xiaoos-shape-path" />
              </svg>
          </div>

          <div class="xiaoos-sys-container">
              <div class="xiaoos-sys-blocks" id="xiaoos-sys-blocks">
                  <div class="xiaoos-sys-b1"></div>
                  <div class="xiaoos-sys-b2"></div>

                  <div class="xiaoos-sys-text-container">
                      <div class="xiaoos-sys-text" id="xiaoos-sys-text">System Loading</div>
                      <div class="xiaoos-sys-fast-bar-container" id="xiaoos-sys-fast-bar-container">
                          <div class="xiaoos-sys-fast-bar" id="xiaoos-sys-fast-bar"></div>
                      </div>
                  </div>

                  <div class="xiaoos-sys-b3"></div>
              </div>
          </div>

      </div>

      <div class="xiaoos-bottom-ui" id="xiaoos-bottom-ui">
          <div class="xiaoos-loading-text">Loading...</div>
          <div class="xiaoos-progress-bar-bg">
              <div class="xiaoos-progress-bar-fill" id="xiaoos-progress-bar"></div>
          </div>
          <div class="xiaoos-hint-text">
              SYSTEM.TIP: Decrypting project archives. Navigate the interface to explore software engineering experience and deployed applications.
          </div>
      </div>

      <div class="xiaoos-reveal-outline" id="xiaoos-reveal-outline"></div>
      <div class="xiaoos-reveal-solid" id="xiaoos-reveal-solid"></div>
    `;

    let overlay = document.getElementById('startup-animation') as HTMLElement | null;
    if (overlay) {
      overlay.className = 'xiaoos-loader-container';
      overlay.style.opacity = '';
      overlay.style.transition = '';
      overlay.innerHTML = markup;
    } else {
      overlay = document.createElement('div');
      overlay.id = 'startup-animation';
      overlay.className = 'xiaoos-loader-container';
      overlay.innerHTML = markup;
      document.body.appendChild(overlay);
    }
    this.container = overlay;

    const grid = document.getElementById('xiaoos-x-grid');
    if (grid) {
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 10; column += 1) {
          const span = document.createElement('span');
          span.className = 'xiaoos-x-item';
          span.innerText = 'X';
          grid.appendChild(span);
        }
      }
    }
  }

  private async startAnimation(): Promise<void> {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.resetState();

    const progressPromise = this.animateWidth('#xiaoos-progress-bar', '100%', 5200, {
      easing: 'linear',
    });

    await this.animateOpacity('#xiaoos-bottom-ui', 1, 150);
    await this.wait(120);
    await this.animateOpacity('.xiaoos-x-item', 1, 40, { staggerMs: 28 });
    await this.wait(120);
    await this.animateWidth('.xiaoos-strike-bar', '100%', 200, {
      staggerMs: 50,
      easing: 'ease-in-out',
    });

    this.setStyle('.xiaoos-x-item', { opacity: 0 });
    await this.animateOpacity('#xiaoos-transition-diamond', 1, 60);
    await this.animateOpacity('#xiaoos-diamond-x-lines', 0, 30, {
      iterations: 12,
      direction: 'alternate',
    });
    await Promise.all([
      this.animateOpacity('#xiaoos-strike-bars', 0, 60),
      this.animateScale('#xiaoos-diamond-shape', 1.1, 220, 'ease-out'),
    ]);
    await this.animateOpacity('#xiaoos-transition-diamond', 0, 40);

    this.setStyle('#xiaoos-diamond-x-lines', { opacity: 1 });
    this.setStyle('#xiaoos-diamond-shape', { opacity: 0 });
    await this.animateOpacity('#xiaoos-transition-diamond', 1, 30);
    await this.wait(60);
    await this.animateOpacity('#xiaoos-transition-diamond', 0, 60);
    await this.wait(120);

    await this.playShapeSequence();
    await this.wait(140);
    await this.playSystemLoading();
    await progressPromise;

    await Promise.all([
      this.animateOpacity('#xiaoos-bottom-ui', 0, 140),
      this.animateOpacity('#xiaoos-display-area', 0, 140),
    ]);

    this.setStyle('#xiaoos-display-area', {
      display: 'none',
      opacity: 0,
    });

    const outlineReveal = this.animateScale(
      '#xiaoos-reveal-outline',
      1,
      420,
      'cubic-bezier(0.16, 1, 0.3, 1)',
    );
    await this.wait(100);
    const solidReveal = this.animateScale(
      '#xiaoos-reveal-solid',
      1,
      320,
      'cubic-bezier(0.32, 0, 0.67, 0)',
    );

    await Promise.all([outlineReveal, solidReveal]);
    this.setStyle('#xiaoos-reveal-outline', { opacity: 0 });
    await this.animateOpacity('#xiaoos-reveal-solid', 0, 420, {
      easing: 'ease-out',
    });

    this.redirectToHome();
  }

  private resetState(): void {
    this.setStyle('#xiaoos-display-area', {
      display: 'flex',
      opacity: 1,
    });
    this.setScale('#xiaoos-reveal-outline', 0);
    this.setScale('#xiaoos-reveal-solid', 0);
    this.setStyle('#xiaoos-reveal-outline', { opacity: 1 });
    this.setStyle('#xiaoos-reveal-solid', { opacity: 1 });
    this.setStyle('.xiaoos-x-item', { opacity: 0 });
    this.setStyle('.xiaoos-strike-bar', { width: '0%' });
    this.setStyle('#xiaoos-strike-bars', { opacity: 1 });
    this.setStyle('#xiaoos-transition-diamond', { opacity: 0 });
    this.setScale('#xiaoos-diamond-shape', 1);
    this.setStyle('#xiaoos-diamond-shape', { opacity: 1 });
    this.setStyle('#xiaoos-diamond-x-lines', { opacity: 1 });
    this.setStyle(
      '.xiaoos-shape-1, .xiaoos-shape-2, .xiaoos-shape-3, .xiaoos-shape-4, .xiaoos-shape-5',
      { opacity: 0 },
    );
    this.setStyle('#xiaoos-sys-blocks', { opacity: 0 });
    this.setStyle('.xiaoos-sys-b1', { opacity: 1 });
    this.setStyle('.xiaoos-sys-b2', { width: 0, opacity: 1 });
    this.setStyle('.xiaoos-sys-b3', { width: 0, opacity: 1 });
    this.setStyle('#xiaoos-sys-fast-bar-container', { opacity: 0 });
    this.setStyle('#xiaoos-sys-fast-bar', { width: '85%' });
    this.setStyle('#xiaoos-sys-text', {
      opacity: 1,
      visibility: 'visible',
    });
    this.setStyle('#xiaoos-bottom-ui', { opacity: 0 });
    this.setStyle('#xiaoos-progress-bar', { width: '0%' });
  }

  private async playShapeSequence(): Promise<void> {
    const selectors = [
      '.xiaoos-shape-1',
      '.xiaoos-shape-2',
      '.xiaoos-shape-3',
      '.xiaoos-shape-4',
      '.xiaoos-shape-5',
    ];

    for (const selector of selectors) {
      this.setStyle(selector, { opacity: 1 });
      await this.wait(120);
      this.setStyle(selector, { opacity: 0 });
      await this.wait(40);
    }
  }

  private async playSystemLoading(): Promise<void> {
    this.setStyle('.xiaoos-sys-b1', { width: SYS_BAR.b1 });
    this.setStyle('.xiaoos-sys-b2', {
      width: SYS_BAR.b2,
      opacity: 0,
    });
    this.setStyle('.xiaoos-sys-b3', {
      width: SYS_BAR.b3,
      opacity: 0,
    });

    await this.animateOpacity('#xiaoos-sys-blocks', 1, 50);
    await this.wait(50);
    await this.animateOpacity('.xiaoos-sys-b2, .xiaoos-sys-b3', 1, 30);
    await this.animateOpacity('.xiaoos-sys-b2, .xiaoos-sys-b3', 0, 30);
    await this.animateOpacity('.xiaoos-sys-b2, .xiaoos-sys-b3', 1, 30);

    this.setStyle('.xiaoos-sys-b2, .xiaoos-sys-b3', { width: 0 });

    await Promise.all([
      this.animateWidth('.xiaoos-sys-b2', SYS_BAR.b2, 550, { easing: 'ease-in-out' }),
      this.animateWidth('.xiaoos-sys-b3', SYS_BAR.b3, 550, { easing: 'ease-in-out' }),
    ]);

    await Promise.all([
      this.animateOpacity('.xiaoos-sys-text', 0, 25, {
        iterations: 5,
        direction: 'alternate',
      }),
      this.animateOpacity('#xiaoos-sys-fast-bar-container', 1, 25, {
        iterations: 5,
        direction: 'alternate',
      }),
    ]);

    this.setStyle('.xiaoos-sys-text', { visibility: 'hidden' });
    await this.animateWidth('#xiaoos-sys-fast-bar', '100%', 380, { easing: 'ease-in-out' });
    await this.wait(60);
    await Promise.all([
      this.animateOpacity('#xiaoos-sys-fast-bar-container', 0, 100),
      this.animateOpacity('.xiaoos-sys-b1, .xiaoos-sys-b2, .xiaoos-sys-b3', 0, 100),
    ]);
  }

  private getElements(target: AnimatableTarget): HTMLElement[] {
    if (!target) return [];
    if (typeof target !== 'string') return [target];
    return Array.from(document.querySelectorAll<HTMLElement>(target));
  }

  private setStyle(target: AnimatableTarget, props: Record<string, StyleValue>): void {
    this.getElements(target).forEach((element) => {
      Object.entries(props).forEach(([key, value]) => {
        this.applyStyle(element, key, value);
      });
    });
  }

  private applyStyle(element: HTMLElement, property: string, value: StyleValue): void {
    switch (property) {
      case 'opacity':
        element.style.opacity = String(value);
        break;
      case 'width':
        element.style.width = typeof value === 'number' ? `${value}px` : String(value);
        break;
      case 'display':
        element.style.display = String(value);
        break;
      case 'visibility':
        element.style.visibility = String(value);
        break;
      case 'transform':
        element.style.transform = String(value);
        break;
      default:
        break;
    }
  }

  private setScale(target: AnimatableTarget, scale: number): void {
    this.getElements(target).forEach((element) => {
      element.style.transform = this.buildScaleTransform(element, scale);
    });
  }

  private buildScaleTransform(element: HTMLElement, scale: number): string {
    switch (element.id) {
      case 'xiaoos-diamond-shape':
        return `rotate(45deg) scale(${scale})`;
      case 'xiaoos-reveal-outline':
      case 'xiaoos-reveal-solid':
        return `translate(-50%, -50%) rotate(45deg) scale(${scale})`;
      default:
        return `scale(${scale})`;
    }
  }

  private animateOpacity(
    target: AnimatableTarget,
    value: number,
    durationMs: number,
    options: AnimationOptions = {},
  ): Promise<void> {
    return this.animate(
      target,
      (element) => [
        { opacity: getComputedStyle(element).opacity },
        { opacity: String(value) },
      ],
      durationMs,
      options,
      (element) => {
        element.style.opacity = String(value);
      },
    );
  }

  private animateWidth(
    target: AnimatableTarget,
    value: string,
    durationMs: number,
    options: AnimationOptions = {},
  ): Promise<void> {
    return this.animate(
      target,
      (element) => [
        { width: getComputedStyle(element).width },
        { width: value },
      ],
      durationMs,
      options,
      (element) => {
        element.style.width = value;
      },
    );
  }

  private animateScale(
    target: AnimatableTarget,
    scale: number,
    durationMs: number,
    easing = 'ease',
  ): Promise<void> {
    return this.animate(
      target,
      (element) => [
        { transform: getComputedStyle(element).transform },
        { transform: this.buildScaleTransform(element, scale) },
      ],
      durationMs,
      { easing },
      (element) => {
        element.style.transform = this.buildScaleTransform(element, scale);
      },
    );
  }

  private animate(
    target: AnimatableTarget,
    keyframes: (element: HTMLElement) => Keyframe[],
    durationMs: number,
    options: AnimationOptions,
    applyFinal: (element: HTMLElement) => void,
  ): Promise<void> {
    const elements = this.getElements(target);
    if (elements.length === 0) return Promise.resolve();

    const {
      delayMs = 0,
      easing = 'ease',
      staggerMs = 0,
      iterations = 1,
      direction = 'normal',
    } = options;

    const animations = elements.map((element, index) => {
      const animation = element.animate(keyframes(element), {
        duration: durationMs,
        delay: delayMs + index * staggerMs,
        easing,
        iterations,
        direction,
        fill: 'forwards',
      });

      return animation.finished
        .catch(() => undefined)
        .then(() => {
          applyFinal(element);
          animation.cancel();
        });
    });

    return Promise.all(animations).then(() => undefined);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  private redirectToHome(): void {
    if (!this.container) return;

    this.container.style.opacity = '0';
    this.container.style.transition = 'opacity 0.28s ease-out';

    window.setTimeout(() => {
      if (this.container?.parentNode) {
        this.container.parentNode.removeChild(this.container);
        this.container = null;
      }

      window.location.href = '/home';
      this.isAnimating = false;
    }, 280);
  }

  public restart(): void {
    if (this.isAnimating) return;
    this.createAnimationContainer();
    void this.startAnimation();
  }

  public get isRunning(): boolean {
    return this.isAnimating;
  }
}

/** Call from terminal entry only. */
export function initStartupAnimation(): void {
  if (window.location.pathname !== '/') return;

  try {
    new StartupAnimation();
  } catch (error) {
    console.error('StartupAnimation: Error:', error);
  }
}
