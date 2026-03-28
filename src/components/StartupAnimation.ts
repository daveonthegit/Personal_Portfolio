import { gsap } from 'gsap';

/** System bar target widths as % of `.xiaoos-sys-blocks` (matches 30/140/180 of 220px design) */
const SYS_BAR = {
  b1: '13.636363%',
  b2: '63.636363%',
  b3: '81.818181%',
} as const;

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
    this.startAnimation();
  }

  private createAnimationContainer(): void {
    const markup = `
      <div class="xiaoos-display-area" id="xiaoos-display-area">
          
          <!-- 1. The X Matrix Grid -->
          <div class="xiaoos-x-grid" id="xiaoos-x-grid"></div>

          <!-- 2. Strikeout bars -->
          <div class="xiaoos-strike-bars" id="xiaoos-strike-bars">
              <div class="xiaoos-strike-bar"></div>
              <div class="xiaoos-strike-bar"></div>
              <div class="xiaoos-strike-bar"></div>
          </div>

          <!-- Initial Transition Diamond (Behind bars) -->
          <div class="xiaoos-transition-diamond" id="xiaoos-transition-diamond">
              <div class="xiaoos-diamond-shape" id="xiaoos-diamond-shape"></div>
              <div class="xiaoos-diamond-x-lines" id="xiaoos-diamond-x-lines">
                  <div class="xiaoos-x-line xiaoos-x-line-1"></div>
                  <div class="xiaoos-x-line xiaoos-x-line-2"></div>
              </div>
          </div>

          <!-- 3. Concentric Geometric Shapes -->
          <div class="xiaoos-shape-container" id="xiaoos-shape-container">
              
              <!-- Shape 1: Just Diamond -->
              <svg class="xiaoos-shape-1" viewBox="0 0 150 150">
                  <polygon points="75,10 140,75 75,140 10,75" class="xiaoos-shape-path" />
              </svg>

              <!-- Shape 2: Diamond + Triangle intersecting bottom -->
              <svg class="xiaoos-shape-2" viewBox="0 0 150 150">
                  <polygon points="75,10 140,75 75,140 10,75" class="xiaoos-shape-path" />
                  <polygon points="10,50 140,50 75,140" class="xiaoos-shape-path" />
              </svg>

              <!-- Shape 3: Diamond + Circle inside -->
              <svg class="xiaoos-shape-3" viewBox="0 0 150 150">
                  <polygon points="75,10 140,75 75,140 10,75" class="xiaoos-shape-path" />
                  <circle cx="75" cy="75" r="45" class="xiaoos-shape-path" />
              </svg>

              <!-- Shape 4: Circle + Previous Triangle -->
              <svg class="xiaoos-shape-4" viewBox="0 0 150 150">
                  <circle cx="75" cy="75" r="45" class="xiaoos-shape-path" />
                  <polygon points="10,50 140,50 75,140" class="xiaoos-shape-path" />
              </svg>

              <!-- Shape 5: Circle + Triangle + Inner Triangle -->
              <svg class="xiaoos-shape-5" viewBox="0 0 150 150">
                  <circle cx="75" cy="75" r="45" class="xiaoos-shape-path" />
                  <polygon points="10,50 140,50 75,140" class="xiaoos-shape-path" />
                  <polygon points="75,50 105,95 45,95" class="xiaoos-shape-path" />
              </svg>
          </div>

          <!-- 4. System Loading -->
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

      <!-- Progress Bar & Hint Text -->
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

    // Reuse terminal.html placeholder to avoid duplicate #startup-animation IDs (breaks mobile)
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

    // Generate the 3x10 grid of X's
    const grid = document.getElementById('xiaoos-x-grid');
    if (grid) {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 10; c++) {
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

    // Resets
    gsap.set("#xiaoos-display-area", { display: "flex" });
    gsap.set("#xiaoos-reveal-outline", { scale: 0, opacity: 1 });
    gsap.set("#xiaoos-reveal-solid", { scale: 0, opacity: 1 });
    
    gsap.set(".xiaoos-x-item", { opacity: 0 });
    gsap.set(".xiaoos-strike-bar", { width: "0%" });
    gsap.set("#xiaoos-strike-bars", { opacity: 1 });
    gsap.set("#xiaoos-transition-diamond", { opacity: 0 });
    gsap.set("#xiaoos-diamond-shape", { scale: 1, opacity: 1 });
    gsap.set("#xiaoos-diamond-x-lines", { opacity: 1 });
    gsap.set(".xiaoos-shape-1, .xiaoos-shape-2, .xiaoos-shape-3, .xiaoos-shape-4, .xiaoos-shape-5", { opacity: 0, scale: 1 });
    
    gsap.set("#xiaoos-sys-blocks", { opacity: 0 });
    gsap.set(".xiaoos-sys-b1", { opacity: 1 });
    gsap.set(".xiaoos-sys-b2", { width: 0, opacity: 1 });
    gsap.set(".xiaoos-sys-b3", { width: 0, opacity: 1 });
    
    gsap.set("#xiaoos-sys-fast-bar-container", { opacity: 0 });
    gsap.set("#xiaoos-sys-fast-bar", { width: "85%" });
    
    gsap.set("#xiaoos-bottom-ui", { opacity: 0 });
    gsap.set("#xiaoos-progress-bar", { width: "0%" });

    const tl = gsap.timeline();

    // Timing scale ~0.5× vs original — same beats, faster pass
    // 0. Bottom UI begins loading immediately
    tl.to("#xiaoos-bottom-ui", { opacity: 1, duration: 0.15 }, 0);

    // 1. Diagonal fill of X's
    tl.to(".xiaoos-x-item", {
        opacity: 1,
        duration: 0.04,
        stagger: {
            each: 0.028,
            grid: [3, 10],
            from: "start"
        }
    }, 0.12);

    // 2. White Bars Strike Out the X's progressively
    tl.to(".xiaoos-strike-bar", {
        width: "100%",
        duration: 0.2,
        stagger: 0.05,
        ease: "power2.inOut"
    }, "+=0.12");

    // 3. Diamond appears DURING the bars striking through
    tl.set(".xiaoos-x-item", { opacity: 0 }, "-=0.1")
      .to("#xiaoos-transition-diamond", { opacity: 1, duration: 0.06 }, "-=0.1");

    // 4. Diamond X glitches (fewer repeats, snappier)
    tl.to("#xiaoos-diamond-x-lines", { opacity: 0, duration: 0.03, yoyo: true, repeat: 11 }, "+=0.04");

    // 5. Bars disappear just before the diamond expansion ends
    tl.to("#xiaoos-strike-bars", { opacity: 0, duration: 0.06 }, "-=0.14");

    // 6. X disappears fully as Diamond expands slightly
    tl.set("#xiaoos-diamond-x-lines", { opacity: 0 }, "-=0.1")
      .to("#xiaoos-diamond-shape", { scale: 1.1, duration: 0.22, ease: "power2.out" }, "-=0.1")
      .to("#xiaoos-transition-diamond", { opacity: 0, duration: 0.03 }, "+=0.08");

    // 7. Large X flash, then vanish
    tl.to("#xiaoos-diamond-x-lines", { opacity: 1, duration: 0 }, "+=0.04")
      .to("#xiaoos-diamond-shape", { opacity: 0, duration: 0 }, "<")
      .to("#xiaoos-transition-diamond", { opacity: 1, duration: 0.03 })
      .to("#xiaoos-transition-diamond", { opacity: 0, duration: 0.06 }, "+=0.06");

    tl.to({}, { duration: 0.12 });

    // 8. Concentric shape sequencing (tighter holds)
    tl.set(".xiaoos-shape-1", { opacity: 1 })
      .set(".xiaoos-shape-1", { opacity: 0 }, "+=0.12")
      .set(".xiaoos-shape-2", { opacity: 1 }, "+=0.04")
      .set(".xiaoos-shape-2", { opacity: 0 }, "+=0.12")
      .set(".xiaoos-shape-3", { opacity: 1 }, "+=0.04")
      .set(".xiaoos-shape-3", { opacity: 0 }, "+=0.12")
      .set(".xiaoos-shape-4", { opacity: 1 }, "+=0.04")
      .set(".xiaoos-shape-4", { opacity: 0 }, "+=0.12")
      .set(".xiaoos-shape-5", { opacity: 1 }, "+=0.04")
      .set(".xiaoos-shape-5", { opacity: 0 }, "+=0.12");

    tl.to({}, { duration: 0.14 });

    // 9. System Loading (% widths scale with narrow `.xiaoos-sys-container` on phones)
    tl.set(".xiaoos-sys-b1", { width: SYS_BAR.b1 })
      .set(".xiaoos-sys-b2", { width: SYS_BAR.b2, opacity: 0 })
      .set(".xiaoos-sys-b3", { width: SYS_BAR.b3, opacity: 0 })
      .to("#xiaoos-sys-blocks", { opacity: 1, duration: 0.05 });

    tl.to(".xiaoos-sys-b2, .xiaoos-sys-b3", { opacity: 1, duration: 0.03 }, "+=0.05")
      .to(".xiaoos-sys-b2, .xiaoos-sys-b3", { opacity: 0, duration: 0.03 })
      .to(".xiaoos-sys-b2, .xiaoos-sys-b3", { opacity: 1, duration: 0.03 });

    tl.set(".xiaoos-sys-b2, .xiaoos-sys-b3", { width: 0 })
      .to(".xiaoos-sys-b2", { width: SYS_BAR.b2, duration: 0.55, ease: "power1.inOut" }, "+=0.04")
      .to(".xiaoos-sys-b3", { width: SYS_BAR.b3, duration: 0.55, ease: "power1.inOut" }, "-=0.55");

    tl.to(".xiaoos-sys-text", { opacity: 0, duration: 0.025, yoyo: true, repeat: 4 })
      .to("#xiaoos-sys-fast-bar-container", { opacity: 1, duration: 0.025, yoyo: true, repeat: 4 }, "<")
      .set(".xiaoos-sys-text", { visibility: "hidden" });

    tl.to("#xiaoos-sys-fast-bar", { width: "100%", duration: 0.38, ease: "power3.inOut" })
      .to("#xiaoos-sys-fast-bar-container", { opacity: 0, duration: 0.1 }, "+=0.06");

    tl.to(".xiaoos-sys-b1, .xiaoos-sys-b2, .xiaoos-sys-b3", { opacity: 0, duration: 0.1 }, "-=0.1");

    const totalDuration = tl.duration();
    tl.to("#xiaoos-progress-bar", { width: "100%", duration: totalDuration, ease: "power1.inOut" }, 0);

    tl.to("#xiaoos-bottom-ui", { opacity: 0, duration: 0.14 })
      .to("#xiaoos-display-area", { display: "none" }, "<");

    // 12. Geometric reveal into home
    tl.to("#xiaoos-reveal-outline", { scale: 1, duration: 0.42, ease: "power3.inOut" })
      .to("#xiaoos-reveal-solid", { scale: 1, duration: 0.32, ease: "power3.in" }, "-=0.32")
      .to("#xiaoos-reveal-outline", { opacity: 0, duration: 0 }, "<")
      .to("#xiaoos-reveal-solid", { opacity: 0, duration: 0.42, ease: "power2.out" }, "+=0.04")
      .add(() => {
          this.redirectToHome();
      });
  }

  private redirectToHome(): void {
    if (!this.container) return;
    
    // Fade out animation entirely
    this.container.style.opacity = '0';
    this.container.style.transition = 'opacity 0.28s ease-out';

    setTimeout(() => {
      if (this.container) {
        document.body.removeChild(this.container);
        this.container = null;
      }

      window.location.href = '/home';
      this.isAnimating = false;
    }, 280);
  }

  // Public method to manually start animation (useful for testing)
  public restart(): void {
    if (this.isAnimating) return;
    this.createAnimationContainer();
    this.startAnimation();
  }

  // Check if animation is currently running
  public get isRunning(): boolean {
    return this.isAnimating;
  }
}

/** Call from terminal entry only (loads GSAP on the boot route). */
export function initStartupAnimation(): void {
  const currentPath = window.location.pathname;
  if (currentPath !== '/') return;
  try {
    new StartupAnimation();
  } catch (error) {
    console.error('StartupAnimation: Error:', error);
  }
}
