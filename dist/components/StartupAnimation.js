/**
 * Terminal Startup Animation Component
 * Matrix-style chaotic terminal explosion with overlapping windows
 */
export class StartupAnimation {
    constructor() {
        this.container = null;
        this.isAnimating = false;
        this.mainTerminal = null;
        this.usedPositions = new Set();
        // Predetermined window placements for low-end devices (avoids random generation overhead)
        this.lowEndPlacements = [
            { top: '10%', left: '60%', rotation: '2deg' },
            { top: '25%', left: '15%', rotation: '-1deg' },
            { top: '45%', left: '70%', rotation: '1deg' },
            { top: '60%', left: '25%', rotation: '-2deg' }
        ];
        // Precreated message arrays for low-end devices (more efficient than random generation)
        this.lowEndMessages = {
            surveillance: [
                'SURVEILLANCE MODULE ACTIVE',
                'Scanning network perimeter...',
                'Target acquisition in progress',
                'Biometric data collected',
                'Security clearance verified',
                'Access protocols engaged',
                'Monitoring all channels',
                'Data stream established'
            ],
            data: [
                'DATA MINING INITIATED',
                'Processing user profiles...',
                'Extracting metadata',
                'Cross-referencing databases',
                'Pattern analysis complete',
                'Information compiled',
                'Data integrity verified',
                'Archive synchronization'
            ],
            analysis: [
                'BEHAVIORAL ANALYSIS RUNNING',
                'Parsing digital footprint...',
                'Social network mapping',
                'Threat assessment active',
                'Risk evaluation complete',
                'Profile classification',
                'Predictive modeling online',
                'Analysis framework ready'
            ],
            access: [
                'ACCESS CONTROL ENGAGED',
                'Authentication protocols...',
                'Permission matrix loaded',
                'Security tokens verified',
                'Encryption keys active',
                'Firewall configuration',
                'Access granted to user',
                'Session established'
            ],
            crypto: [
                'CRYPTOGRAPHIC MODULE',
                'Initializing cipher suites...',
                'Key exchange protocol',
                'Hash verification active',
                'Digital signatures valid',
                'Secure channel open',
                'Encryption layer active',
                'Crypto operations ready'
            ],
            monitor: [
                'SYSTEM MONITOR ONLINE',
                'Resource utilization...',
                'Performance metrics',
                'Network traffic analysis',
                'System health check',
                'Process monitoring',
                'Alert system active',
                'Monitoring dashboard ready'
            ]
        };
        console.log('StartupAnimation: Constructor called');
        console.log('StartupAnimation: Document ready state:', document.readyState);
        console.log('StartupAnimation: Document body exists:', !!document.body);
        this.init();
    }
    init() {
        console.log('StartupAnimation: Initializing...');
        this.createAnimationContainer();
        this.startAnimation();
    }
    createAnimationContainer() {
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
    createMainTerminal() {
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
    async startAnimation() {
        if (this.isAnimating)
            return;
        this.isAnimating = true;
        // Reset used positions for fresh animation
        this.usedPositions.clear();
        const mainContent = document.getElementById('main-terminal-content');
        if (!mainContent)
            return;
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
    async executeOSLoadingSequence(content) {
        // Detect device type for reporting
        const isLowEndDevice = this.detectLowEndDevice();
        const deviceType = isLowEndDevice ? 'Low-Performance' : 'High-Performance';
        const optimizationLevel = isLowEndDevice ? 'Performance Mode' : 'Full Experience';
        const osSteps = [
            { delay: 0, text: 'Initializing xiaoOS v2.1...', type: 'system' },
            { delay: 800, text: 'Loading kernel modules...', type: 'loading' },
            { delay: 1500, text: 'Mounting surveillance filesystem...', type: 'system' },
            { delay: 2200, text: 'Starting network protocols...', type: 'loading' },
            { delay: 3000, text: 'Activating security subsystems...', type: 'system' },
            { delay: 3600, text: `Device profile: ${deviceType} hardware detected`, type: 'system' },
            { delay: 4000, text: `Optimization: ${optimizationLevel} enabled`, type: 'system' },
            { delay: 4400, text: 'xiaoOS v2.1 ready for operation', type: 'success' },
            { delay: 4800, text: '', type: 'prompt' }
        ];
        for (const step of osSteps) {
            await this.wait(step.delay);
            this.addTerminalLine(content, step.text, step.type, 'main');
        }
    }
    async promptUserInteraction(content) {
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
    async simulateTyping(content, text) {
        const cursorLine = content.querySelector('.cursor-blink');
        if (!cursorLine)
            return;
        let currentText = '';
        for (let i = 0; i < text.length; i++) {
            currentText += text[i];
            cursorLine.textContent = currentText + '_';
            await this.wait(50 + Math.random() * 100); // Random typing speed
        }
        // Remove cursor after typing
        cursorLine.textContent = currentText;
    }
    async createMatrixTerminalExplosion() {
        if (!this.container)
            return;
        // Detect low-end device and adjust terminal count
        const isLowEndDevice = this.detectLowEndDevice();
        // Create multiple overlapping terminals with random positions
        const allTerminalConfigs = [
            { id: 'surveillance-terminal', title: 'Surveillance Matrix', type: 'surveillance', delay: 0 },
            { id: 'network-terminal', title: 'Network Scanner', type: 'network', delay: 300 },
            { id: 'security-terminal', title: 'Security Breach', type: 'security', delay: 600 },
            { id: 'data-terminal', title: 'Data Extraction', type: 'data', delay: 900 },
            { id: 'analysis-terminal', title: 'Target Analysis', type: 'analysis', delay: 1200 },
            { id: 'access-terminal', title: 'Access Control', type: 'access', delay: 1500 },
            { id: 'crypto-terminal', title: 'Crypto Decoder', type: 'crypto', delay: 1800 },
            { id: 'monitor-terminal', title: 'System Monitor', type: 'monitor', delay: 2100 }
        ];
        // Reduce terminal count for low-end devices (50% fewer terminals)
        const terminalConfigs = isLowEndDevice
            ? allTerminalConfigs.slice(0, 4) // Only 4 terminals on low-end devices
            : allTerminalConfigs; // All 8 terminals on high-end devices
        console.log(`Creating ${terminalConfigs.length} terminals for ${isLowEndDevice ? 'low-end' : 'high-end'} device`);
        // Create terminals with staggered timing and random positions
        for (const config of terminalConfigs) {
            setTimeout(() => {
                this.createOverlappingTerminal(config);
            }, config.delay);
        }
    }
    createOverlappingTerminal(config) {
        if (!this.container)
            return;
        const terminal = document.createElement('div');
        terminal.className = `startup-terminal startup-terminal-${config.type} matrix-terminal-overlay`;
        terminal.id = config.id;
        // Check if this is a low-end device
        const isLowEndDevice = this.detectLowEndDevice();
        let position;
        if (isLowEndDevice) {
            // Use predetermined placements for low-end devices (no random generation overhead)
            const terminalIndex = this.usedPositions.size; // Use size as index since we're creating sequentially
            const placementIndex = terminalIndex % this.lowEndPlacements.length;
            const placement = this.lowEndPlacements[placementIndex];
            if (placement) {
                position = {
                    top: placement.top,
                    left: placement.left,
                    transform: `rotate(${placement.rotation})`
                };
            }
            else {
                // Fallback position for low-end devices
                position = {
                    top: '10%',
                    left: '60%',
                    transform: 'rotate(2deg)'
                };
            }
        }
        else {
            // High-end devices: use the full random position system
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
            if (availablePositions.length > 0) {
                const selectedPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
                if (selectedPosition) {
                    position = selectedPosition;
                    const positionKey = `${selectedPosition.top}-${selectedPosition.left}`;
                    this.usedPositions.add(positionKey);
                }
                else {
                    // Fallback if selectedPosition is undefined
                    position = { top: '10%', left: '10%', transform: 'rotate(0deg)' };
                }
            }
            else {
                // Fallback if all positions are used (shouldn't happen with 8 terminals)
                const fallbackPosition = allPositions[Math.floor(Math.random() * allPositions.length)];
                position = fallbackPosition || { top: '10%', left: '10%', transform: 'rotate(0deg)' };
            }
        }
        // Apply position styling
        terminal.style.position = 'absolute';
        terminal.style.top = position.top;
        terminal.style.left = position.left;
        terminal.style.transform = position.transform;
        terminal.style.zIndex = isLowEndDevice ? '15' : (Math.floor(Math.random() * 5) + 15).toString();
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
    async executeMatrixTextStorm() {
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
    generateMatrixText(contentId, terminalType) {
        const content = document.getElementById(contentId);
        if (!content)
            return;
        // Comprehensive device performance detection
        const isLowEndDevice = this.detectLowEndDevice();
        // Use precreated messages for low-end devices, or full arrays for high-end devices
        const texts = isLowEndDevice ?
            this.lowEndMessages[terminalType] || ['Processing...'] :
            this.getHighEndMessages(terminalType);
        // Optimize text generation based on device performance
        const generateText = () => {
            // Dramatically reduce text generation for low-end devices
            const lineCount = isLowEndDevice ? 8 : 50; // 84% fewer lines on low-end devices
            const baseDelay = isLowEndDevice ? 200 : 50; // 4x slower on low-end devices
            const randomDelay = isLowEndDevice ? 300 : 100; // 3x slower random delay
            for (let i = 0; i < lineCount; i++) {
                setTimeout(() => {
                    const randomText = texts[Math.floor(Math.random() * texts.length)] || 'Processing...';
                    this.addMatrixTerminalLine(content, randomText, 'matrix', terminalType);
                }, i * (baseDelay + Math.random() * randomDelay));
            }
        };
        generateText();
        // Reduce number of text generation cycles for low-end devices
        if (!isLowEndDevice) {
            // High-end devices: full experience with 3 cycles
            setTimeout(() => generateText(), 2000);
            setTimeout(() => generateText(), 4000);
        }
        else {
            // Low-end devices: single additional cycle with longer delay
            setTimeout(() => generateText(), 4000);
        }
    }
    addMatrixTerminalLine(content, text, type, terminalType) {
        const line = document.createElement('div');
        line.className = `terminal-line ${type} matrix-text-line`;
        const prompt = `root@xiaoOS-${terminalType}:~$`;
        if (type === 'matrix') {
            line.innerHTML = `<span class="prompt">${prompt}</span> <span class="matrix-text">${text}</span>`;
        }
        else if (type === 'loading') {
            line.innerHTML = `<span class="prompt">${prompt}</span> ${text} <span class="loading-dots">...</span>`;
        }
        else if (type === 'system') {
            line.innerHTML = `<span class="system-prefix">[SYSTEM]</span> ${text}`;
        }
        else if (type === 'success') {
            line.innerHTML = `<span class="prompt">${prompt}</span> <span class="success-text">${text}</span>`;
        }
        else if (type === 'hack') {
            line.innerHTML = `<span class="prompt">${prompt}</span> <span class="hack-text">${text}</span>`;
        }
        else if (type === 'prompt') {
            line.innerHTML = `<span class="prompt">${prompt}</span> <span class="cursor-blink">_</span>`;
        }
        else {
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
    addMatrixFinalMessages() {
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
    addTerminalLine(content, text, type, terminalType) {
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        const prompt = `root@xiaoOS-${terminalType}:~$`;
        if (type === 'loading') {
            line.innerHTML = `<span class="prompt">${prompt}</span> ${text} <span class="loading-dots">...</span>`;
        }
        else if (type === 'system') {
            line.innerHTML = `<span class="system-prefix">[SYSTEM]</span> ${text}`;
        }
        else if (type === 'success') {
            line.innerHTML = `<span class="prompt">${prompt}</span> <span class="success-text">${text}</span>`;
        }
        else if (type === 'hack') {
            line.innerHTML = `<span class="prompt">${prompt}</span> <span class="hack-text">${text}</span>`;
        }
        else if (type === 'prompt') {
            line.innerHTML = `<span class="prompt">${prompt}</span> <span class="cursor-blink">_</span>`;
        }
        else {
            line.textContent = text;
        }
        content.appendChild(line);
        // Auto-scroll to bottom
        content.scrollTop = content.scrollHeight;
    }
    redirectToHome() {
        if (!this.container)
            return;
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
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Public method to manually start animation (useful for testing)
    restart() {
        if (this.isAnimating)
            return;
        this.createAnimationContainer();
        this.startAnimation();
    }
    // Check if animation is currently running
    get isRunning() {
        return this.isAnimating;
    }
    getHighEndMessages(terminalType) {
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
        return matrixTexts[terminalType] || ['Processing...'];
    }
    detectLowEndDevice() {
        // Multiple performance indicators to detect low-end devices
        const indicators = {
            // Mobile device check
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            // Small screen size
            isSmallScreen: window.innerWidth <= 768 || window.innerHeight <= 600,
            // Hardware concurrency (CPU cores)
            lowCoreCount: navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2,
            // Memory limitations (if available)
            lowMemory: navigator.deviceMemory && navigator.deviceMemory <= 2,
            // Connection speed (if available)
            slowConnection: navigator.connection &&
                (navigator.connection.effectiveType === 'slow-2g' ||
                    navigator.connection.effectiveType === '2g' ||
                    navigator.connection.effectiveType === '3g'),
            // User agent patterns for known low-end devices
            lowEndUA: /Android.*Mobile.*Chrome\/[1-7][0-9]\.|iPhone.*OS [1-9]_|iPad.*OS [1-9]_/.test(navigator.userAgent),
            // Touch device (often mobile/tablet)
            isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            // Older browser versions
            oldBrowser: /Chrome\/[1-7][0-9]\.|Firefox\/[1-6][0-9]\.|Safari\/[1-9][0-9][0-9]\./.test(navigator.userAgent)
        };
        // Consider it low-end if multiple indicators are true
        const trueIndicators = Object.values(indicators).filter(Boolean).length;
        // Log for debugging (can be removed in production)
        console.log('Device performance indicators:', indicators);
        console.log('Low-end device score:', trueIndicators, '/ 8');
        // Device is considered low-end if 2+ indicators are true
        return trueIndicators >= 2;
    }
}
// Simple initialization
function initStartupAnimation() {
    console.log('StartupAnimation: Initializing... VERSION 2.1.0');
    const currentPath = window.location.pathname;
    console.log('StartupAnimation: Current path:', currentPath);
    if (currentPath === '/') {
        console.log('StartupAnimation: Root route - starting animation');
        try {
            new StartupAnimation();
        }
        catch (error) {
            console.error('StartupAnimation: Error:', error);
        }
    }
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStartupAnimation);
}
else {
    // DOM is already loaded
    initStartupAnimation();
}
//# sourceMappingURL=StartupAnimation.js.map