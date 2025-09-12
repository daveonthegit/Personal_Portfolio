/**
 * Glitch Animation Controller
 * Handles intersection observer and glitch effects for cards
 */
interface GlitchOptions {
    threshold?: number;
    rootMargin?: string;
    delay?: number;
    staggerDelay?: number;
}
declare class GlitchAnimationController {
    private options;
    private observer;
    private animatedElements;
    constructor(options?: GlitchOptions);
    private init;
    private handleIntersection;
    private triggerGlitchLoad;
    private observeElements;
    private setupHoverEffects;
    destroy(): void;
}
export declare function createTerminalLoader(container: HTMLElement, messages: string[]): Promise<void>;
export declare function createDataCorruption(element: HTMLElement, duration?: number): void;
export declare function initGlitchAnimations(): GlitchAnimationController;
export default GlitchAnimationController;
//# sourceMappingURL=glitchAnimations.d.ts.map