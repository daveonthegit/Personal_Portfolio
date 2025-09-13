/**
 * Terminal Startup Animation Component
 * Matrix-style chaotic terminal explosion with overlapping windows
 */

export class StartupAnimation {
  private container: HTMLElement | null = null;
  private isAnimating = false;
  private mainTerminal: HTMLElement | null = null;

  constructor() {
    console.log('StartupAnimation: Constructor called');
    this.init();
  }

  private init(): void {
    console.log('StartupAnimation: Initializing...');
    this.createAnimationContainer();
    this.startAnimation();
  }

  private createAnimationContainer(): void {
    console.log('StartupAnimation: Creating chaotic terminal container...');
    // Create the startup animation overlay
    const overlay = document.createElement('div');
    overlay.id = 'startup-animation';
    overlay.className = 'startup-animation-overlay';
    
    // Create main terminal (this stays as the base)
    this.mainTerminal = this.createMainTerminal();
    overlay.appendChild(this.mainTerminal);
    
    // Add to body
    document.body.appendChild(overlay);
    this.container = overlay;
    console.log('StartupAnimation: Main terminal container created');
  }

  private createMainTerminal(): HTMLElement {
    const terminal = document.createElement('div');
    terminal.className = 'startup-terminal startup-terminal-main main-terminal-base';
    terminal.id = 'main-terminal';
    
    // Create terminal header
    const header = document.createElement('div');
    header.className = 'startup-terminal-header';
    header.innerHTML = `
      <div class="startup-terminal-controls">
        <div class="startup-terminal-control startup-terminal-control-close"></div>
        <div class="startup-terminal-control startup-terminal-control-minimize"></div>
        <div class="startup-terminal-control startup-terminal-control-maximize"></div>
      </div>
      <div class="startup-terminal-title">xiaoOS v2.1 - Main Terminal</div>
    `;
    
    // Create terminal content
    const content = document.createElement('div');
    content.className = 'startup-terminal-content';
    content.id = 'main-terminal-content';
    
    terminal.appendChild(header);
    terminal.appendChild(content);
    
    return terminal;
  }

  private async startAnimation(): Promise<void> {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Reset used positions for fresh animation
    this.usedPositions.clear();

    const mainContent = document.getElementById('main-terminal-content');
    if (!mainContent) return;

    // Phase 1: OS Loading Sequence
    await this.executeOSLoadingSequence(mainContent);
    
    // Phase 2: User Interaction
    await this.promptUserInteraction(mainContent);
    
    // Phase 3: Matrix-Style Terminal Explosion
    await this.createMatrixTerminalExplosion();
    
    // Phase 4: Massive Text Storm
    await this.executeMatrixTextStorm();
    
    // Phase 5: Redirect to home
    this.redirectToHome();
  }

  private async executeOSLoadingSequence(content: HTMLElement): Promise<void> {
    const osSteps = [
      { delay: 0, text: 'Initializing xiaoOS v2.1...', type: 'system' },
      { delay: 800, text: 'Loading kernel modules...', type: 'loading' },
      { delay: 1500, text: 'Mounting surveillance filesystem...', type: 'system' },
      { delay: 2200, text: 'Starting network protocols...', type: 'loading' },
      { delay: 3000, text: 'Activating security subsystems...', type: 'system' },
      { delay: 3800, text: 'xiaoOS v2.1 ready for operation', type: 'success' },
      { delay: 4200, text: '', type: 'prompt' }
    ];

    for (const step of osSteps) {
      await this.wait(step.delay);
      this.addTerminalLine(content, step.text, step.type, 'main');
    }
  }

  private async promptUserInteraction(content: HTMLElement): Promise<void> {
    // Add interactive prompt
    const promptLine = document.createElement('div');
    promptLine.className = 'terminal-line interactive-prompt';
    promptLine.innerHTML = `
      <span class="prompt">root@xiaoOS-main:~$</span> 
      <span class="interactive-text">Enter target file to access:</span>
      <span class="cursor-blink">_</span>
    `;
    content.appendChild(promptLine);
    
    // Auto-fill the target after a delay (like typing)
    await this.wait(1000);
    await this.simulateTyping(content, 'DAVID_XIAO.portfolio');
    
    // Simulate pressing Enter
    await this.wait(500);
    this.addTerminalLine(content, 'Accessing target file: DAVID_XIAO.portfolio...', 'system', 'main');
    
    await this.wait(1000);
    this.addTerminalLine(content, 'Initiating matrix protocol...', 'success', 'main');
  }

  private async simulateTyping(content: HTMLElement, text: string): Promise<void> {
    const cursorLine = content.querySelector('.cursor-blink');
    if (!cursorLine) return;

    let currentText = '';
    for (let i = 0; i < text.length; i++) {
      currentText += text[i];
      cursorLine.textContent = currentText + '_';
      await this.wait(50 + Math.random() * 100); // Random typing speed
    }
    
    // Remove cursor after typing
    cursorLine.textContent = currentText;
  }

  private async createMatrixTerminalExplosion(): Promise<void> {
    if (!this.container) return;
    
    // Create multiple overlapping terminals with random positions
    const terminalConfigs = [
      { id: 'surveillance-terminal', title: 'Surveillance Matrix', type: 'surveillance', delay: 0 },
      { id: 'network-terminal', title: 'Network Scanner', type: 'network', delay: 300 },
      { id: 'security-terminal', title: 'Security Breach', type: 'security', delay: 600 },
      { id: 'data-terminal', title: 'Data Extraction', type: 'data', delay: 900 },
      { id: 'analysis-terminal', title: 'Target Analysis', type: 'analysis', delay: 1200 },
      { id: 'access-terminal', title: 'Access Control', type: 'access', delay: 1500 },
      { id: 'crypto-terminal', title: 'Crypto Decoder', type: 'crypto', delay: 1800 },
      { id: 'monitor-terminal', title: 'System Monitor', type: 'monitor', delay: 2100 }
    ];
    
    // Create terminals with staggered timing and random positions
    for (const config of terminalConfigs) {
      setTimeout(() => {
        this.createOverlappingTerminal(config);
      }, config.delay);
    }
  }

  private usedPositions = new Set<string>();

  private createOverlappingTerminal(config: {id: string, title: string, type: string, delay: number}): void {
    if (!this.container) return;
    
    const terminal = document.createElement('div');
    terminal.className = `startup-terminal startup-terminal-${config.type} matrix-terminal-overlay`;
    terminal.id = config.id;
    
    // Expanded position grid with many more options
    const allPositions = [
      // Top row
      { top: '5%', left: '5%', transform: 'rotate(-1deg)' },
      { top: '5%', left: '15%', transform: 'rotate(1deg)' },
      { top: '5%', left: '25%', transform: 'rotate(-2deg)' },
      { top: '5%', left: '35%', transform: 'rotate(1deg)' },
      { top: '5%', left: '45%', transform: 'rotate(-1deg)' },
      { top: '5%', left: '55%', transform: 'rotate(2deg)' },
      { top: '5%', left: '65%', transform: 'rotate(-1deg)' },
      { top: '5%', left: '75%', transform: 'rotate(1deg)' },
      { top: '5%', left: '85%', transform: 'rotate(-2deg)' },
      
      // Second row
      { top: '15%', left: '8%', transform: 'rotate(1deg)' },
      { top: '15%', left: '18%', transform: 'rotate(-1deg)' },
      { top: '15%', left: '28%', transform: 'rotate(2deg)' },
      { top: '15%', left: '38%', transform: 'rotate(-1deg)' },
      { top: '15%', left: '48%', transform: 'rotate(1deg)' },
      { top: '15%', left: '58%', transform: 'rotate(-2deg)' },
      { top: '15%', left: '68%', transform: 'rotate(1deg)' },
      { top: '15%', left: '78%', transform: 'rotate(-1deg)' },
      { top: '15%', left: '88%', transform: 'rotate(2deg)' },
      
      // Third row
      { top: '25%', left: '3%', transform: 'rotate(-1deg)' },
      { top: '25%', left: '13%', transform: 'rotate(1deg)' },
      { top: '25%', left: '23%', transform: 'rotate(-2deg)' },
      { top: '25%', left: '33%', transform: 'rotate(1deg)' },
      { top: '25%', left: '43%', transform: 'rotate(-1deg)' },
      { top: '25%', left: '53%', transform: 'rotate(2deg)' },
      { top: '25%', left: '63%', transform: 'rotate(-1deg)' },
      { top: '25%', left: '73%', transform: 'rotate(1deg)' },
      { top: '25%', left: '83%', transform: 'rotate(-2deg)' },
      
      // Fourth row
      { top: '35%', left: '6%', transform: 'rotate(1deg)' },
      { top: '35%', left: '16%', transform: 'rotate(-1deg)' },
      { top: '35%', left: '26%', transform: 'rotate(2deg)' },
      { top: '35%', left: '36%', transform: 'rotate(-1deg)' },
      { top: '35%', left: '46%', transform: 'rotate(1deg)' },
      { top: '35%', left: '56%', transform: 'rotate(-2deg)' },
      { top: '35%', left: '66%', transform: 'rotate(1deg)' },
      { top: '35%', left: '76%', transform: 'rotate(-1deg)' },
      { top: '35%', left: '86%', transform: 'rotate(2deg)' },
      
      // Fifth row
      { top: '45%', left: '1%', transform: 'rotate(-1deg)' },
      { top: '45%', left: '11%', transform: 'rotate(1deg)' },
      { top: '45%', left: '21%', transform: 'rotate(-2deg)' },
      { top: '45%', left: '31%', transform: 'rotate(1deg)' },
      { top: '45%', left: '41%', transform: 'rotate(-1deg)' },
      { top: '45%', left: '51%', transform: 'rotate(2deg)' },
      { top: '45%', left: '61%', transform: 'rotate(-1deg)' },
      { top: '45%', left: '71%', transform: 'rotate(1deg)' },
      { top: '45%', left: '81%', transform: 'rotate(-2deg)' },
      
      // Sixth row
      { top: '55%', left: '4%', transform: 'rotate(1deg)' },
      { top: '55%', left: '14%', transform: 'rotate(-1deg)' },
      { top: '55%', left: '24%', transform: 'rotate(2deg)' },
      { top: '55%', left: '34%', transform: 'rotate(-1deg)' },
      { top: '55%', left: '44%', transform: 'rotate(1deg)' },
      { top: '55%', left: '54%', transform: 'rotate(-2deg)' },
      { top: '55%', left: '64%', transform: 'rotate(1deg)' },
      { top: '55%', left: '74%', transform: 'rotate(-1deg)' },
      { top: '55%', left: '84%', transform: 'rotate(2deg)' },
      
      // Bottom row
      { top: '65%', left: '7%', transform: 'rotate(-1deg)' },
      { top: '65%', left: '17%', transform: 'rotate(1deg)' },
      { top: '65%', left: '27%', transform: 'rotate(-2deg)' },
      { top: '65%', left: '37%', transform: 'rotate(1deg)' },
      { top: '65%', left: '47%', transform: 'rotate(-1deg)' },
      { top: '65%', left: '57%', transform: 'rotate(2deg)' },
      { top: '65%', left: '67%', transform: 'rotate(-1deg)' },
      { top: '65%', left: '77%', transform: 'rotate(1deg)' },
      { top: '65%', left: '87%', transform: 'rotate(-2deg)' }
    ];
    
    // Find an available position
    const availablePositions = allPositions.filter(pos => {
      const positionKey = `${pos.top}-${pos.left}`;
      return !this.usedPositions.has(positionKey);
    });
    
    let position: { top: string; left: string; transform: string } | undefined;
    if (availablePositions.length > 0) {
      position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      if (position) {
        const positionKey = `${position.top}-${position.left}`;
        this.usedPositions.add(positionKey);
      }
    } else {
      // Fallback if all positions are used (shouldn't happen with 8 terminals)
      position = allPositions[Math.floor(Math.random() * allPositions.length)];
    }
    
    // Ensure position is defined before using it
    if (position) {
      terminal.style.position = 'absolute';
      terminal.style.top = position.top;
      terminal.style.left = position.left;
      terminal.style.transform = position.transform;
      terminal.style.zIndex = (Math.floor(Math.random() * 5) + 15).toString();
    } else {
      // Ultimate fallback
      terminal.style.position = 'absolute';
      terminal.style.top = '10%';
      terminal.style.left = '10%';
      terminal.style.transform = 'rotate(0deg)';
      terminal.style.zIndex = '15';
    }
    
    // Create terminal header
    const header = document.createElement('div');
    header.className = 'startup-terminal-header';
    header.innerHTML = `
      <div class="startup-terminal-controls">
        <div class="startup-terminal-control startup-terminal-control-close"></div>
        <div class="startup-terminal-control startup-terminal-control-minimize"></div>
        <div class="startup-terminal-control startup-terminal-control-maximize"></div>
      </div>
      <div class="startup-terminal-title">${config.title}</div>
    `;
    
    // Create terminal content
    const content = document.createElement('div');
    content.className = 'startup-terminal-content';
    content.id = `${config.id}-content`;
    
    terminal.appendChild(header);
    terminal.appendChild(content);
    
    // Add dramatic entrance animation
    terminal.style.opacity = '0';
    if (position) {
      terminal.style.transform = `${position.transform} scale(0.5)`;
    }
    
    this.container.appendChild(terminal);
    
    // Animate in
    setTimeout(() => {
      terminal.style.transition = 'all 0.3s ease-out';
      terminal.style.opacity = '1';
      if (position) {
        terminal.style.transform = position.transform;
      }
    }, 100);
    
    // Start generating rapid text for this terminal
    this.generateMatrixText(`${config.id}-content`, config.type);
  }

  private async executeMatrixTextStorm(): Promise<void> {
    // Generate massive amounts of rapid text across all terminals
    const terminals = [
      { id: 'main-terminal-content', type: 'main' },
      { id: 'surveillance-terminal-content', type: 'surveillance' },
      { id: 'network-terminal-content', type: 'network' },
      { id: 'security-terminal-content', type: 'security' },
      { id: 'data-terminal-content', type: 'data' },
      { id: 'analysis-terminal-content', type: 'analysis' },
      { id: 'access-terminal-content', type: 'access' },
      { id: 'crypto-terminal-content', type: 'crypto' },
      { id: 'monitor-terminal-content', type: 'monitor' }
    ];

    // Start rapid text generation for all terminals
    terminals.forEach(terminal => this.generateMatrixText(terminal.id, terminal.type));
    
    // Wait for the matrix sequence
    await this.wait(6000);
    
    // Add final success messages
    this.addMatrixFinalMessages();
  }

  private generateMatrixText(contentId: string, terminalType: string): void {
    const content = document.getElementById(contentId);
    if (!content) return;

    const matrixTexts = {
      main: [
        'xiaoOS v2.1 online...',
        'Matrix protocol activated...',
        'Neural network initialized...',
        'Quantum encryption loaded...',
        'Target locked: DAVID_XIAO...'
      ],
      surveillance: [
        'Scanning biometric signatures...',
        'Processing facial recognition data...',
        'Analyzing movement patterns...',
        'Tracking digital footprint...',
        'Monitoring communication channels...',
        'Cross-referencing databases...',
        'Building psychological profile...'
      ],
      network: [
        'Penetrating firewall defenses...',
        'Bypassing security protocols...',
        'Establishing backdoor connections...',
        'Intercepting data packets...',
        'Mapping network topology...',
        'Exploiting zero-day vulnerabilities...',
        'Injecting malicious payloads...'
      ],
      security: [
        'Exploiting buffer overflow...',
        'Escalating privileges...',
        'Bypassing authentication...',
        'Accessing restricted areas...',
        'Injecting SQL payloads...',
        'Brute forcing credentials...',
        'Social engineering attack...'
      ],
      data: [
        'Extracting personal files...',
        'Decrypting sensitive data...',
        'Downloading contact lists...',
        'Scanning social media profiles...',
        'Compiling comprehensive dossier...',
        'Analyzing behavioral patterns...',
        'Cross-referencing multiple sources...'
      ],
      analysis: [
        'Running behavioral analysis...',
        'Building psychological profile...',
        'Identifying key connections...',
        'Assessing threat level...',
        'Predicting future actions...',
        'Analyzing communication patterns...',
        'Mapping social networks...'
      ],
      access: [
        'Overriding access controls...',
        'Generating fake credentials...',
        'Bypassing security checks...',
        'Granting elevated permissions...',
        'Establishing persistent access...',
        'Creating backdoor accounts...',
        'Modifying system logs...'
      ],
      crypto: [
        'Breaking encryption algorithms...',
        'Decrypting secure communications...',
        'Cracking password hashes...',
        'Analyzing cryptographic keys...',
        'Exploiting weak ciphers...',
        'Reverse engineering protocols...',
        'Bypassing digital signatures...'
      ],
      monitor: [
        'Monitoring system resources...',
        'Tracking network traffic...',
        'Analyzing system logs...',
        'Detecting security breaches...',
        'Monitoring user activities...',
        'Tracking file access patterns...',
        'Analyzing system performance...'
      ]
    };

    const texts = matrixTexts[terminalType as keyof typeof matrixTexts] || ['Processing...'];
    
    // Generate massive amounts of rapid text
    const generateText = () => {
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          const randomText = texts[Math.floor(Math.random() * texts.length)] || 'Processing...';
          this.addMatrixTerminalLine(content, randomText, 'matrix', terminalType);
        }, i * (50 + Math.random() * 100));
      }
    };
    
    generateText();
    
    // Continue generating more text
    setTimeout(() => generateText(), 2000);
    setTimeout(() => generateText(), 4000);
  }

  private addMatrixTerminalLine(content: HTMLElement, text: string, type: string, terminalType: string): void {
    const line = document.createElement('div');
    line.className = `terminal-line ${type} matrix-text-line`;
    
    const prompt = `root@xiaoOS-${terminalType}:~$`;
    
    if (type === 'matrix') {
      line.innerHTML = `<span class="prompt">${prompt}</span> <span class="matrix-text">${text}</span>`;
    } else if (type === 'loading') {
      line.innerHTML = `<span class="prompt">${prompt}</span> ${text} <span class="loading-dots">...</span>`;
    } else if (type === 'system') {
      line.innerHTML = `<span class="system-prefix">[SYSTEM]</span> ${text}`;
    } else if (type === 'success') {
      line.innerHTML = `<span class="prompt">${prompt}</span> <span class="success-text">${text}</span>`;
    } else if (type === 'hack') {
      line.innerHTML = `<span class="prompt">${prompt}</span> <span class="hack-text">${text}</span>`;
    } else if (type === 'prompt') {
      line.innerHTML = `<span class="prompt">${prompt}</span> <span class="cursor-blink">_</span>`;
    } else {
      line.textContent = text;
    }
    
    content.appendChild(line);
    
    // Auto-scroll to bottom
    content.scrollTop = content.scrollHeight;
    
    // Remove old lines to prevent memory issues
    const lines = content.querySelectorAll('.matrix-text-line');
    if (lines.length > 100) {
      const firstLine = lines[0];
      if (firstLine) {
        firstLine.remove();
      }
    }
  }

  private addMatrixFinalMessages(): void {
    const terminals = [
      'main-terminal-content',
      'surveillance-terminal-content',
      'network-terminal-content', 
      'security-terminal-content',
      'data-terminal-content',
      'analysis-terminal-content',
      'access-terminal-content',
      'crypto-terminal-content',
      'monitor-terminal-content'
    ];

    terminals.forEach(terminalId => {
      const content = document.getElementById(terminalId);
      if (content) {
        this.addMatrixTerminalLine(content, 'MATRIX PROTOCOL COMPLETE', 'success', 'final');
        this.addMatrixTerminalLine(content, 'TARGET DOSSIER READY', 'success', 'final');
      }
    });
  }

  private addTerminalLine(content: HTMLElement, text: string, type: string, terminalType: string): void {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    
    const prompt = `root@xiaoOS-${terminalType}:~$`;
    
    if (type === 'loading') {
      line.innerHTML = `<span class="prompt">${prompt}</span> ${text} <span class="loading-dots">...</span>`;
    } else if (type === 'system') {
      line.innerHTML = `<span class="system-prefix">[SYSTEM]</span> ${text}`;
    } else if (type === 'success') {
      line.innerHTML = `<span class="prompt">${prompt}</span> <span class="success-text">${text}</span>`;
    } else if (type === 'hack') {
      line.innerHTML = `<span class="prompt">${prompt}</span> <span class="hack-text">${text}</span>`;
    } else if (type === 'prompt') {
      line.innerHTML = `<span class="prompt">${prompt}</span> <span class="cursor-blink">_</span>`;
    } else {
      line.textContent = text;
    }
    
    content.appendChild(line);
    
    // Auto-scroll to bottom
    content.scrollTop = content.scrollHeight;
  }

  private redirectToHome(): void {
    if (!this.container) return;
    
    // Add final redirect message to main terminal
    const mainContent = document.getElementById('main-terminal-content');
    if (mainContent) {
      const finalLine = document.createElement('div');
      finalLine.className = 'terminal-line redirect';
      finalLine.innerHTML = `<span class="prompt">root@xiaoOS-main:~$</span> <span class="redirect-text">Matrix protocol complete. Accessing DAVID_XIAO.dossier...</span>`;
      mainContent.appendChild(finalLine);
    }
    
    // Fade out animation
    this.container.style.opacity = '0';
    this.container.style.transition = 'opacity 1.0s ease-out';
    
    setTimeout(() => {
      if (this.container) {
        document.body.removeChild(this.container);
        this.container = null;
      }
      
      // Redirect to home page
      window.location.href = '/home';
      this.isAnimating = false;
    }, 1000);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('StartupAnimation: DOM loaded, checking route...');
  console.log('StartupAnimation: User agent:', navigator.userAgent);
  console.log('StartupAnimation: Viewport size:', window.innerWidth + 'x' + window.innerHeight);
  console.log('StartupAnimation: Host:', window.location.host);
  console.log('StartupAnimation: Protocol:', window.location.protocol);
  
  // Only run startup animation on the root route (terminal page)
  const currentPath = window.location.pathname;
  console.log('StartupAnimation: Current path:', currentPath);
  
  // Check if required elements exist
  const startupContainer = document.getElementById('startup-animation');
  console.log('StartupAnimation: Startup container found:', !!startupContainer);
  
  // Test if we can create elements
  const testDiv = document.createElement('div');
  testDiv.id = 'animation-test';
  testDiv.style.position = 'fixed';
  testDiv.style.top = '10px';
  testDiv.style.left = '10px';
  testDiv.style.background = 'red';
  testDiv.style.color = 'white';
  testDiv.style.padding = '10px';
  testDiv.style.zIndex = '99999';
  testDiv.textContent = 'Animation Test - JS Working';
  document.body.appendChild(testDiv);
  
  // Remove test div after 3 seconds
  setTimeout(() => {
    const testElement = document.getElementById('animation-test');
    if (testElement) {
      testElement.remove();
    }
  }, 3000);
  
  if (currentPath === '/') {
    console.log('StartupAnimation: Root route detected - showing matrix animation');
    
    // Additional checks before starting animation
    const cssLoaded = document.querySelector('link[href*="main.css"]');
    console.log('StartupAnimation: CSS file loaded:', !!cssLoaded);
    
    // Test CSS classes
    const testStyle = window.getComputedStyle(document.documentElement);
    console.log('StartupAnimation: CSS computed styles available:', !!testStyle);
    
    try {
      new StartupAnimation();
      console.log('StartupAnimation: Animation instance created successfully');
    } catch (error) {
      console.error('StartupAnimation: Error creating animation:', error);
      
      // Fallback: try to show a simple animation
      console.log('StartupAnimation: Attempting fallback animation...');
      try {
        const fallbackDiv = document.createElement('div');
        fallbackDiv.style.position = 'fixed';
        fallbackDiv.style.top = '0';
        fallbackDiv.style.left = '0';
        fallbackDiv.style.width = '100%';
        fallbackDiv.style.height = '100%';
        fallbackDiv.style.background = 'black';
        fallbackDiv.style.color = 'lime';
        fallbackDiv.style.fontFamily = 'monospace';
        fallbackDiv.style.fontSize = '20px';
        fallbackDiv.style.display = 'flex';
        fallbackDiv.style.alignItems = 'center';
        fallbackDiv.style.justifyContent = 'center';
        fallbackDiv.style.zIndex = '99999';
        fallbackDiv.innerHTML = '<div>xiaoOS Loading...<br/>Fallback Mode</div>';
        document.body.appendChild(fallbackDiv);
        
        setTimeout(() => {
          fallbackDiv.remove();
          window.location.href = '/home';
        }, 3000);
      } catch (fallbackError) {
        console.error('StartupAnimation: Fallback also failed:', fallbackError);
      }
    }
  } else {
    console.log('StartupAnimation: Non-root route detected - skipping animation');
    // For other routes, just show the main content immediately
    const mainContent = document.getElementById('main-content');
    const nav = document.getElementById('main-nav');
    
    console.log('StartupAnimation: Main content found:', !!mainContent);
    console.log('StartupAnimation: Main nav found:', !!nav);
    
    if (mainContent) {
      mainContent.style.opacity = '1';
      mainContent.style.transform = 'translateY(0)';
      mainContent.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    }
    
    if (nav) {
      nav.style.opacity = '1';
      nav.style.transform = 'translateY(0)';
      nav.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    }
  }
});