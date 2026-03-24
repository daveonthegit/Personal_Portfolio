import { gsap } from 'gsap';

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
    const overlay = document.createElement('div');
    overlay.id = 'startup-animation';
    overlay.className = 'xiaoos-loader-container';
    
    overlay.innerHTML = `
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

    document.body.appendChild(overlay);
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

    // 0. Bottom UI begins loading immediately
    tl.to("#xiaoos-bottom-ui", { opacity: 1, duration: 0.3 }, 0); 

    // 1. Diagonal fill of X's (Slightly slower)
    tl.to(".xiaoos-x-item", {
        opacity: 1,
        duration: 0.08,
        stagger: {
            each: 0.06,
            grid: [3, 10],
            from: "start"
        }
    }, 0.3);

    // 2. White Bars Strike Out the X's progressively
    tl.to(".xiaoos-strike-bar", {
        width: "100%",
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.inOut"
    }, "+=0.3");

    // 3. Diamond appears DURING the bars striking through
    // X's disappear immediately behind it
    tl.set(".xiaoos-x-item", { opacity: 0 }, "-=0.2")
      .to("#xiaoos-transition-diamond", { opacity: 1, duration: 0.1 }, "-=0.2");

    // 4. Diamond X constantly glitches in and out while Bars wait
    tl.to("#xiaoos-diamond-x-lines", { opacity: 0, duration: 0.05, yoyo: true, repeat: 19 }, "+=0.1");

    // 5. Bars disappear just before the diamond expansion ends
    tl.to("#xiaoos-strike-bars", { opacity: 0, duration: 0.1 }, "-=0.3");

    // 6. X disappears fully as Diamond Expands slightly
    tl.set("#xiaoos-diamond-x-lines", { opacity: 0 }, "-=0.2") // Ensure X is gone completely
      .to("#xiaoos-diamond-shape", { scale: 1.1, duration: 0.4, ease: "power2.out" }, "-=0.2") 
      .to("#xiaoos-transition-diamond", { opacity: 0, duration: 0.05 }, "+=0.2"); 

    // 7. Reappear just the large X quickly, then vanish
    tl.to("#xiaoos-diamond-x-lines", { opacity: 1, duration: 0 }, "+=0.1")
      .to("#xiaoos-diamond-shape", { opacity: 0, duration: 0 }, "<") // ensure diamond remains hidden
      .to("#xiaoos-transition-diamond", { opacity: 1, duration: 0.05 }) // show container again
      .to("#xiaoos-transition-diamond", { opacity: 0, duration: 0.1 }, "+=0.15"); // disappear quickly

    // Small gap of nothing
    tl.to({}, { duration: 0.3 });

    // 8. Concentric Shape Sequencing
    // State 1: Just Diamond
    tl.set(".xiaoos-shape-1", { opacity: 1 })
      .set(".xiaoos-shape-1", { opacity: 0 }, "+=0.25") 
      
      // State 2: Diamond + Triangle intersecting bottom
      .set(".xiaoos-shape-2", { opacity: 1 }, "+=0.1") 
      .set(".xiaoos-shape-2", { opacity: 0 }, "+=0.25")
      
      // State 3: Diamond with Circle inside
      .set(".xiaoos-shape-3", { opacity: 1 }, "+=0.1")
      .set(".xiaoos-shape-3", { opacity: 0 }, "+=0.25")
      
      // State 4: Circle + Previous Triangle
      .set(".xiaoos-shape-4", { opacity: 1 }, "+=0.1")
      .set(".xiaoos-shape-4", { opacity: 0 }, "+=0.25")

      // State 5: Circle + Triangle + Inner Triangle (or Diamond)
      .set(".xiaoos-shape-5", { opacity: 1 }, "+=0.1")
      .set(".xiaoos-shape-5", { opacity: 0 }, "+=0.25");

    // Small gap of nothing
    tl.to({}, { duration: 0.4 });

    // 9. System Loading Text & Bars
    // First, top bar is solid, other two start invisible
    tl.set(".xiaoos-sys-b1", { width: 30 }) // Top bar already has size
      .set(".xiaoos-sys-b2", { width: 140, opacity: 0 }) 
      .set(".xiaoos-sys-b3", { width: 180, opacity: 0 })
      .to("#xiaoos-sys-blocks", { opacity: 1, duration: 0.1 }); // Show block

    // The two bottom bars briefly flicker on, off, and back on
    tl.to(".xiaoos-sys-b2, .xiaoos-sys-b3", { opacity: 1, duration: 0.05 }, "+=0.1")
      .to(".xiaoos-sys-b2, .xiaoos-sys-b3", { opacity: 0, duration: 0.05 })
      .to(".xiaoos-sys-b2, .xiaoos-sys-b3", { opacity: 1, duration: 0.05 });

    // Now reset their widths to 0, but keep them opaque, and let them progress
    tl.set(".xiaoos-sys-b2, .xiaoos-sys-b3", { width: 0 })
      .to(".xiaoos-sys-b2", { width: 140, duration: 1.2, ease: "power1.inOut" }, "+=0.1")
      .to(".xiaoos-sys-b3", { width: 180, duration: 1.2, ease: "power1.inOut" }, "-=1.2");

    // Blink and swap system loading text ONLY WITH the fast progress bar
    tl.to(".xiaoos-sys-text", { opacity: 0, duration: 0.04, yoyo: true, repeat: 4 }) 
      .to("#xiaoos-sys-fast-bar-container", { opacity: 1, duration: 0.04, yoyo: true, repeat: 4 }, "<") 
      .set(".xiaoos-sys-text", { visibility: "hidden" }); // Use visibility instead of display none to preserve layout

    // 10. Fast progress bar finishes filling up completely alone
    tl.to("#xiaoos-sys-fast-bar", { width: "100%", duration: 0.8, ease: "power3.inOut" })
      .to("#xiaoos-sys-fast-bar-container", { opacity: 0, duration: 0.2 }, "+=0.2");

    // Hide the remaining top/bottom system bars right before the sequence ends
    tl.to(".xiaoos-sys-b1, .xiaoos-sys-b2, .xiaoos-sys-b3", { opacity: 0, duration: 0.2 }, "-=0.2");

    // Now calculate total duration so the bottom bar exactly matches the center animations
    const totalDuration = tl.duration();
    tl.to("#xiaoos-progress-bar", { width: "100%", duration: totalDuration, ease: "power1.inOut" }, 0);

    // 11. Transition to main app exactly as the center sequence ends
    tl.to("#xiaoos-bottom-ui", { opacity: 0, duration: 0.3 })
      .to("#xiaoos-display-area", { display: "none" }, "<");

    // 12. Main App Boot Animation
    tl.to("#xiaoos-reveal-outline", { scale: 1, duration: 0.8, ease: "power3.inOut" })
      .to("#xiaoos-reveal-solid", { scale: 1, duration: 0.6, ease: "power3.in" }, "-=0.6")
      .to("#xiaoos-reveal-outline", { opacity: 0, duration: 0 }, "<") // Hide outline once solid covers it
      .to("#xiaoos-reveal-solid", { opacity: 0, duration: 0.8, ease: "power2.out" }, "+=0.1") // Solid fades to reveal content
      .add(() => {
          this.redirectToHome();
      });
  }

  private redirectToHome(): void {
    if (!this.container) return;
    
    // Fade out animation entirely
    this.container.style.opacity = '0';
    this.container.style.transition = 'opacity 0.5s ease-out';
    
    setTimeout(() => {
      if (this.container) {
        document.body.removeChild(this.container);
        this.container = null;
      }
      
      // Redirect to home page
      window.location.href = '/home';
      this.isAnimating = false;
    }, 500);
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

// Simple initialization
function initStartupAnimation() {
  const currentPath = window.location.pathname;
  
  if (currentPath === '/') {
    try {
      new StartupAnimation();
    } catch (error) {
      console.error('StartupAnimation: Error:', error);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStartupAnimation);
} else {
  // DOM is already loaded
  initStartupAnimation();
}
