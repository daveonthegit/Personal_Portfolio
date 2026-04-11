// Ambient desktop widgets — floating preview windows (xiaoOS background layer)
interface SurveillanceWindow {
  id: string;
  element: HTMLElement;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'camera' | 'data' | 'security' | 'system'; /* display channel kinds */
  isActive: boolean;
  createdAt: number;
}

class SurveillanceSystem {
  private container: HTMLElement;
  private windows: SurveillanceWindow[] = [];
  private isActive: boolean = false;
  private animationId: number | null = null;
  private windowGenerationTimer: number | null = null;
  private usedVideoIds: Set<string> = new Set();
  private windowPositions: Array<{x: number, y: number, width: number, height: number}> = [];

  constructor(container: HTMLElement) {
    this.container = container;
    
    // Handle window resize to update position calculations
    window.addEventListener('resize', () => {
      this.updatePositionsOnResize();
    });
  }

  public initSurveillance(): void {
    console.log('xiaoOS ambient displays — initializing…');
    this.isActive = true;
    this.createSurveillanceOverlay();
    this.startWindowGeneration();
    this.startWindowAnimation();
  }

  private createSurveillanceOverlay(): void {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 pointer-events-none z-0 overflow-hidden';
    overlay.innerHTML = `
      <!-- Ambient grid — cyan reference -->
      <div class="absolute inset-0 opacity-10" style="background-image: 
        radial-gradient(rgba(0, 210, 255, 0.15) 1px, transparent 1px),
        linear-gradient(rgba(0, 210, 255, 0.05) 1px, transparent 1px), 
        linear-gradient(90deg, rgba(0, 210, 255, 0.05) 1px, transparent 1px);
        background-size: 30px 30px, 100px 100px, 100px 100px;"></div>
      
      <!-- Blur layer over widget stack -->
      <div class="absolute inset-0 backdrop-blur-sm" style="z-index: 2; background: rgba(0,0,0,0.1);"></div>
      
      <!-- Widget container -->
      <div class="surveillance-windows-container" style="z-index: 1;"></div>
      
      <!-- Desktop status overlay -->
      <div class="absolute top-20 left-4 text-xs font-mono bg-black/60 border border-[#00d2ff]/35 p-3 backdrop-blur-md rounded-sm">
        <div class="text-[#00d2ff] font-bold tracking-widest mb-2" style="font-family: 'IBM Plex Mono', monospace;">xiaoOS DESKTOP</div>
        <div class="text-gray-400 space-y-1">
          <div>FEEDS: <span id="camera-count" class="text-[#00d2ff]">0</span> | DATA: <span id="data-count" class="text-[#00d2ff]">0</span></div>
          <div>NET: <span id="security-count" class="text-[#00d2ff]">0</span> | SYS: <span id="system-count" class="text-[#00d2ff]">0</span></div>
        </div>
      </div>
    `;
    this.container.appendChild(overlay);
  }

  private startWindowGeneration(): void {
    console.log('Starting ambient widget generation…');
    
    const generateWindow = () => {
      if (this.isActive && this.windows.length < 12) {
        this.createSurveillanceWindow();
        
        // Schedule next generation - faster for more video camera popups
        const nextDelay = Math.random() * 2000 + 1000; // 1-3 seconds
        this.windowGenerationTimer = window.setTimeout(generateWindow, nextDelay);
      }
    };
    
    // Start immediately
    generateWindow();
  }

  private findValidPosition(width: number, height: number): {x: number, y: number} | null {
    const maxAttempts = 50; // Prevent infinite loops
    const padding = 20; // Minimum distance between windows
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Try random positions within safe bounds
      const x = Math.random() * (100 - (width / window.innerWidth) * 100 - 2) + 1; // 1-99% with width consideration
      const y = Math.random() * (100 - (height / window.innerHeight) * 100 - 2) + 1; // 1-99% with height consideration
      
      // Convert percentage to pixels for collision detection
      const xPx = (x / 100) * window.innerWidth;
      const yPx = (y / 100) * window.innerHeight;
      
      // Check if this position collides with existing windows
      if (!this.checkCollision(xPx, yPx, width, height, padding)) {
        // Add this position to our tracking
        this.windowPositions.push({ x: xPx, y: yPx, width, height });
        return { x, y };
      }
    }
    
    return null; // No valid position found
  }
  
  private checkCollision(x: number, y: number, width: number, height: number, padding: number): boolean {
    const newRect = {
      left: x - padding,
      top: y - padding,
      right: x + width + padding,
      bottom: y + height + padding
    };
    
    return this.windowPositions.some(pos => {
      const existingRect = {
        left: pos.x - padding,
        top: pos.y - padding,
        right: pos.x + pos.width + padding,
        bottom: pos.y + pos.height + padding
      };
      
      return !(newRect.left >= existingRect.right || 
               newRect.right <= existingRect.left || 
               newRect.top >= existingRect.bottom || 
               newRect.bottom <= existingRect.top);
    });
  }

  private async createSurveillanceWindow(): Promise<void> {
    // Emphasize video camera popups - 70% chance for camera, 30% for others
    const otherTypes: ('data' | 'security' | 'system')[] = ['data', 'security', 'system'];
    const randomType: 'camera' | 'data' | 'security' | 'system' = Math.random() < 0.7 ? 'camera' : 
      (otherTypes[Math.floor(Math.random() * otherTypes.length)] || 'data');
    
    const window = document.createElement('div');
    const id = `surv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Determine window size first
    let width, height;
    if (randomType === 'camera') {
      // Video cameras are much larger and more prominent
      width = Math.random() * 200 + 400; // 400-600px
      height = Math.random() * 150 + 300; // 300-450px
    } else {
      // Other windows stay smaller
      width = Math.random() * 200 + 150; // 150-350px
      height = Math.random() * 150 + 100; // 100-250px
    }
    
    // Find a valid position that doesn't overlap with existing windows
    const position = this.findValidPosition(width, height);
    if (!position) {
      console.log('No slot for new ambient window');
      return;
    }
    
    const { x, y } = position;
    
    window.className = `absolute bg-black/90 border border-white/10 shadow-lg surveillance-window backdrop-blur-md`;
    window.setAttribute('data-type', randomType);
    window.style.left = `${x}%`;
    window.style.top = `${y}%`;
    window.style.width = `${width}px`;
    window.style.height = `${height}px`;
    window.style.zIndex = '1';
    window.style.opacity = '0';
    window.style.borderRadius = '0';
    
    // Enhanced styling for video cameras with cyan accents (newstyle)
    if (randomType === 'camera') {
      window.classList.add('surveillance-camera');
      window.style.boxShadow = '0 0 30px rgba(0, 210, 255, 0.4), inset 0 0 20px rgba(0, 210, 255, 0.1)';
      window.style.borderWidth = '1px';
      window.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      window.style.borderTop = '2px solid #00d2ff';
      window.style.zIndex = '1';
    } else {
      window.classList.add('surveillance-data');
      window.style.boxShadow = '0 0 15px rgba(0, 210, 255, 0.2)';
      window.style.borderTop = '1px solid rgba(0, 210, 255, 0.3)';
    }
    // Random pop-in effect
    const effects = [
      'scale(0.8) translateY(20px)', // Bounce up
      'scale(0.8) translateY(-20px)', // Bounce down
      'scale(0.5) translateX(-30px)', // Slide from left
      'scale(0.5) translateX(30px)', // Slide from right
      'scale(0.3) rotate(-5deg)', // Rotate in
      'scale(0.3) rotate(5deg)' // Rotate in opposite
    ];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)] as string;
    window.style.transform = randomEffect;
    window.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    // Window content based on type
    const content = await this.generateWindowContent(randomType, id);
    window.innerHTML = content;
    
    // Add to container
    const windowsContainer = this.container.querySelector('.surveillance-windows-container');
    if (windowsContainer) {
      windowsContainer.appendChild(window);
      
      // Trigger pop-in animation after a brief delay
      setTimeout(() => {
        window.style.opacity = '0.85';
        window.style.transform = 'scale(1) translateY(0) rotate(0deg)';
        
        // Enhanced glow effect for video cameras (newstyle cyan)
        if (randomType === 'camera') {
          window.style.boxShadow = '0 0 40px rgba(0, 210, 255, 0.6), 0 0 80px rgba(0, 210, 255, 0.3), inset 0 0 20px rgba(0, 210, 255, 0.1)';
          // Add pulsing effect for video cameras
          window.style.animation = 'videoCameraPulse 2s ease-in-out infinite';
        } else {
          window.style.boxShadow = '0 0 25px rgba(0, 210, 255, 0.4), 0 0 50px rgba(0, 210, 255, 0.2)';
        }
        
        // Reset glow after animation
        setTimeout(() => {
          if (randomType === 'camera') {
            window.style.boxShadow = '0 0 30px rgba(0, 210, 255, 0.4), inset 0 0 20px rgba(0, 210, 255, 0.1)';
          } else {
            window.style.boxShadow = '0 0 15px rgba(0, 210, 255, 0.2)';
          }
        }, 600);
      }, 50);
    }
    
    // Store window data
    const windowData: SurveillanceWindow = {
      id,
      element: window,
      x,
      y,
      width,
      height,
      type: randomType,
      isActive: true,
      createdAt: Date.now()
    };
    
    this.windows.push(windowData);
    this.updateStatusCounts();
    
    // Auto-remove after 15-30 seconds
    setTimeout(() => {
      this.removeWindow(id);
    }, Math.random() * 15000 + 15000);
    
    console.log(`Created ${randomType} ambient window: ${id}`);
  }

  private async fetch511NYCameras(): Promise<Array<{id: string, name: string, streamUrl: string}>> {
    try {
      // Try the actual 511NY API endpoint
      const response = await fetch('https://511ny.org/api/cctv?start=0&length=50');
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((camera: any) => ({
          id: camera.id || camera.cameraId,
          name: camera.name || camera.description || camera.location,
          streamUrl: `https://511ny.org/NoSession/GetCctvImage?cameraId=${camera.id || camera.cameraId}`
        }));
      }
      
      // Fallback to hardcoded camera streams with real working IDs
      return this.getFallbackCameraStreams();
    } catch (error) {
      console.log('Failed to fetch 511NY cameras, using fallback:', error);
      return this.getFallbackCameraStreams();
    }
  }


  private getFallbackCameraStreams(): Array<{id: string, name: string, streamUrl: string}> {
    // Custom surveillance videos from YouTube - perfect for xiaoOS system
    const cameraStreams = [
      // Your custom surveillance videos
      { id: 'surv-001', name: 'Preview channel 001', streamUrl: 'https://www.youtube.com/embed/0vkld4n1a7o?autoplay=1&mute=1' },
      { id: 'surv-002', name: 'Preview channel 002', streamUrl: 'https://www.youtube.com/embed/CZnY66m0Xiw?autoplay=1&mute=1' },
      { id: 'surv-003', name: 'Preview channel 003', streamUrl: 'https://www.youtube.com/embed/pFebijydkDM?autoplay=1&mute=1' },
      { id: 'surv-004', name: 'Preview channel 004', streamUrl: 'https://www.youtube.com/embed/5o59zyi7EyA?autoplay=1&mute=1' },
      { id: 'surv-005', name: 'Preview channel 005', streamUrl: 'https://www.youtube.com/embed/nNkSMJP0Tyg?autoplay=1&mute=1' },
      { id: 'surv-006', name: 'Preview channel 006', streamUrl: 'https://www.youtube.com/embed/MusSS4R9SPw?autoplay=1&mute=1' },
      { id: 'surv-007', name: 'Preview channel 007', streamUrl: 'https://www.youtube.com/embed/xn7t5kQ21Es?autoplay=1&mute=1' },
      { id: 'surv-008', name: 'Preview channel 008', streamUrl: 'https://www.youtube.com/embed/EcM9m7Eo0u4?autoplay=1&mute=1' },
      { id: 'surv-009', name: 'Preview channel 009', streamUrl: 'https://www.youtube.com/embed/slJKmz9XsIU?autoplay=1&mute=1' },
      { id: 'surv-010', name: 'Preview channel 010', streamUrl: 'https://www.youtube.com/embed/KaEU5MNdrp4?autoplay=1&mute=1' },
      { id: 'surv-011', name: 'Preview channel 011', streamUrl: 'https://www.youtube.com/embed/7mnbtXqdmr0?autoplay=1&mute=1' },
      { id: 'surv-012', name: 'Preview channel 012', streamUrl: 'https://www.youtube.com/embed/k57aOn5JluY?autoplay=1&mute=1' },
      { id: 'surv-013', name: 'Preview channel 013', streamUrl: 'https://www.youtube.com/embed/PI63KrE3UGo?autoplay=1&mute=1' },
      { id: 'surv-014', name: 'Preview channel 014', streamUrl: 'https://www.youtube.com/embed/VSiQ7BLkZHw?autoplay=1&mute=1' }
    ];
    
    return cameraStreams;
  }

  private async generateWindowContent(type: string, id: string): Promise<string> {
    const timestamp = new Date().toLocaleTimeString();
    
    switch (type) {
      case 'camera':
        // Fetch real camera data from 511NY API
        try {
          const cameraData = await this.fetch511NYCameras();
          
          // Filter out already used videos
          const availableCameras = cameraData.filter(camera => !this.usedVideoIds.has(camera.id));
          
          // If all videos have been used, reset the used set and use all cameras
          if (availableCameras.length === 0) {
            this.usedVideoIds.clear();
            availableCameras.push(...cameraData);
          }
          
          const randomCamera = availableCameras[Math.floor(Math.random() * availableCameras.length)];
          if (!randomCamera) throw new Error('No camera data available');
          
          // Mark this video as used
          this.usedVideoIds.add(randomCamera.id);
          
          const cameraLocation = randomCamera.name || randomCamera.id;
          const streamUrl = randomCamera.streamUrl;
        
          return `
            <div class="p-1 h-full flex flex-col" style="font-family: 'JetBrains Mono', monospace;">
              <!-- Corner accents -->
              <div style="position: absolute; top: -1px; left: -1px; width: 12px; height: 12px; border-top: 2px solid #00d2ff; border-left: 2px solid #00d2ff; z-index: 10;"></div>
              <div style="position: absolute; bottom: -1px; right: -1px; width: 12px; height: 12px; border-bottom: 2px solid #00d2ff; border-right: 2px solid #00d2ff; z-index: 10;"></div>
              
              <div class="flex justify-between items-center mb-1 bg-black/60 px-2 py-1 border-b border-white/10">
                <span class="text-[#00d2ff] text-[10px] font-bold tracking-widest">CAM-${id.slice(-4).toUpperCase()}</span>
                <span class="text-gray-500 text-[10px]">${timestamp}</span>
              </div>
              <div class="flex-1 bg-black border border-white/10 relative overflow-hidden">
                <iframe src="${streamUrl}" 
                        class="w-full h-full"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        style="pointer-events: none;">
                </iframe>
                <div class="absolute inset-0 bg-gradient-to-br from-[#00d2ff]/5 to-transparent pointer-events-none"></div>
                <div class="absolute top-2 left-2 text-[#00d2ff] text-[10px] bg-black/70 px-1 border border-[#00d2ff]/30 pointer-events-none">LIVE</div>
                <div class="absolute bottom-2 right-2 text-[#ff5500] text-[10px] bg-black/70 px-1 animate-pulse pointer-events-none">● REC</div>
                <div class="absolute top-2 right-2 text-white/60 text-[10px] bg-black/70 px-1 pointer-events-none">HD</div>
                <div class="absolute bottom-2 left-2 text-white/80 text-[10px] bg-black/70 px-1 pointer-events-none">${cameraLocation}</div>
              </div>
              <div class="text-gray-500 text-[10px] mt-1 px-1">STATUS: <span class="text-[#00d2ff]">ACTIVE</span> | SOURCE: CUSTOM</div>
            </div>
          `;
        } catch (error) {
          // Fallback to custom surveillance videos if API fails
          const fallbackStreams = [
            { id: 'surv-001', name: 'Preview channel 001', url: 'https://www.youtube.com/embed/0vkld4n1a7o?autoplay=1&mute=1' },
            { id: 'surv-002', name: 'Preview channel 002', url: 'https://www.youtube.com/embed/CZnY66m0Xiw?autoplay=1&mute=1' },
            { id: 'surv-003', name: 'Preview channel 003', url: 'https://www.youtube.com/embed/pFebijydkDM?autoplay=1&mute=1' }
          ];
          
          // Filter out already used videos
          const availableFallbacks = fallbackStreams.filter(stream => !this.usedVideoIds.has(stream.id));
          
          // If all fallback videos have been used, reset the used set
          if (availableFallbacks.length === 0) {
            this.usedVideoIds.clear();
            availableFallbacks.push(...fallbackStreams);
          }
          
          const fallbackStream = availableFallbacks[Math.floor(Math.random() * availableFallbacks.length)];
          if (!fallbackStream) throw new Error('No fallback stream available');
          
          // Mark this video as used
          this.usedVideoIds.add(fallbackStream.id);
          
          return `
            <div class="p-1 h-full flex flex-col" style="font-family: 'JetBrains Mono', monospace;">
              <!-- Corner accents -->
              <div style="position: absolute; top: -1px; left: -1px; width: 12px; height: 12px; border-top: 2px solid #00d2ff; border-left: 2px solid #00d2ff; z-index: 10;"></div>
              <div style="position: absolute; bottom: -1px; right: -1px; width: 12px; height: 12px; border-bottom: 2px solid #00d2ff; border-right: 2px solid #00d2ff; z-index: 10;"></div>
              
              <div class="flex justify-between items-center mb-1 bg-black/60 px-2 py-1 border-b border-white/10">
                <span class="text-[#00d2ff] text-[10px] font-bold tracking-widest">CAM-${id.slice(-4).toUpperCase()}</span>
                <span class="text-gray-500 text-[10px]">${timestamp}</span>
              </div>
              <div class="flex-1 bg-black border border-white/10 relative overflow-hidden">
                <iframe src="${fallbackStream.url}" 
                        class="w-full h-full"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        style="pointer-events: none;">
                </iframe>
                <div class="absolute inset-0 bg-gradient-to-br from-[#00d2ff]/5 to-transparent pointer-events-none"></div>
                <div class="absolute top-2 left-2 text-[#00d2ff] text-[10px] bg-black/70 px-1 border border-[#00d2ff]/30 pointer-events-none">LIVE</div>
                <div class="absolute bottom-2 right-2 text-[#ff5500] text-[10px] bg-black/70 px-1 animate-pulse pointer-events-none">● REC</div>
                <div class="absolute top-2 right-2 text-white/60 text-[10px] bg-black/70 px-1 pointer-events-none">HD</div>
                <div class="absolute bottom-2 left-2 text-white/80 text-[10px] bg-black/70 px-1 pointer-events-none">${fallbackStream.name}</div>
              </div>
              <div class="text-gray-500 text-[10px] mt-1 px-1">STATUS: <span class="text-[#00d2ff]">ACTIVE</span> | SOURCE: CUSTOM</div>
            </div>
          `;
        }
        
      case 'data':
        const dataStreams = [
          ['→ 192.168.1.100:443', '→ 10.0.0.15:22', '→ 172.16.0.5:80', '→ 192.168.1.200:3389', '→ 10.0.0.25:443'],
          ['→ 203.0.113.45:80', '→ 198.51.100.23:443', '→ 192.0.2.15:22', '→ 203.0.113.67:993', '→ 198.51.100.89:25'],
          ['→ 172.16.0.10:3389', '→ 10.0.0.5:443', '→ 192.168.0.15:80', '→ 172.16.0.20:22', '→ 10.0.0.25:993'],
          ['→ 203.0.113.12:443', '→ 198.51.100.45:80', '→ 192.0.2.23:22', '→ 203.0.113.89:3389', '→ 198.51.100.67:25']
        ];
        const randomStream = dataStreams[Math.floor(Math.random() * dataStreams.length)];
        const streamHtml = randomStream ? randomStream.map(stream => `<div class="text-[#00d2ff]">${stream}</div>`).join('') : '';
        
        return `
          <div class="p-1 h-full flex flex-col" style="font-family: 'JetBrains Mono', monospace;">
            <div class="flex justify-between items-center mb-1 bg-black/60 px-2 py-1 border-b border-white/10">
              <span class="text-[#00d2ff] text-[10px] font-bold tracking-widest">DATA-${id.slice(-4).toUpperCase()}</span>
              <span class="text-gray-500 text-[10px]">${timestamp}</span>
            </div>
            <div class="flex-1 bg-black/60 border border-white/10 p-2 text-[10px]">
              <div class="mb-1 text-gray-400 uppercase tracking-wider">PACKET STREAM:</div>
              <div class="space-y-1">
                ${streamHtml}
              </div>
              <div class="mt-3 pt-2 border-t border-white/5 text-gray-500">
                <div>ENCRYPTION: <span class="text-[#00d2ff]">AES-256</span></div>
                <div>BANDWIDTH: <span class="text-white">${Math.floor(Math.random() * 50 + 10)}Mbps</span></div>
              </div>
            </div>
          </div>
        `;
        
      case 'security':
        return `
          <div class="p-1 h-full flex flex-col" style="font-family: 'JetBrains Mono', monospace;">
            <div class="flex justify-between items-center mb-1 bg-black/60 px-2 py-1 border-b border-white/10">
              <span class="text-[#ff5500] text-[10px] font-bold tracking-widest">SEC-${id.slice(-4).toUpperCase()}</span>
              <span class="text-gray-500 text-[10px]">${timestamp}</span>
            </div>
            <div class="flex-1 bg-black/60 border border-white/10 p-2 text-[10px]">
              <div class="mb-2 text-[#ff5500] font-bold animate-pulse">⚠ THREAT DETECTED</div>
              <div class="space-y-1 text-gray-400">
                <div>SCAN: <span class="text-[#00d2ff]">IN PROGRESS</span></div>
                <div>FIREWALL: <span class="text-[#4ade80]">ACTIVE</span></div>
                <div>ANTIVIRUS: <span class="text-[#4ade80]">UPDATED</span></div>
                <div>INTRUSION: <span class="text-[#ff5500]">BLOCKED</span></div>
              </div>
              <div class="mt-3 pt-2 border-t border-white/5 text-gray-500">STATUS: <span class="text-[#4ade80]">SECURE</span></div>
            </div>
          </div>
        `;
        
      case 'system':
        const cpuVal = Math.floor(Math.random() * 40 + 20);
        const ramVal = Math.floor(Math.random() * 30 + 40);
        const diskVal = Math.floor(Math.random() * 20 + 60);
        const netVal = Math.floor(Math.random() * 50 + 10);
        return `
          <div class="p-1 h-full flex flex-col" style="font-family: 'JetBrains Mono', monospace;">
            <div class="flex justify-between items-center mb-1 bg-black/60 px-2 py-1 border-b border-white/10">
              <span class="text-[#00d2ff] text-[10px] font-bold tracking-widest">SYS-${id.slice(-4).toUpperCase()}</span>
              <span class="text-gray-500 text-[10px]">${timestamp}</span>
            </div>
            <div class="flex-1 bg-black/60 border border-white/10 p-2 text-[10px]">
              <div class="mb-2 text-gray-400 uppercase tracking-wider">SYSTEM STATUS:</div>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-gray-500">CPU</span>
                  <div class="flex items-center gap-2">
                    <div class="w-16 h-1 bg-white/10"><div class="h-full bg-[#00d2ff]" style="width: ${cpuVal}%"></div></div>
                    <span class="text-white w-8 text-right">${cpuVal}%</span>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-500">RAM</span>
                  <div class="flex items-center gap-2">
                    <div class="w-16 h-1 bg-white/10"><div class="h-full bg-[#00d2ff]" style="width: ${ramVal}%"></div></div>
                    <span class="text-white w-8 text-right">${ramVal}%</span>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-500">DISK</span>
                  <div class="flex items-center gap-2">
                    <div class="w-16 h-1 bg-white/10"><div class="h-full bg-[#00d2ff]" style="width: ${diskVal}%"></div></div>
                    <span class="text-white w-8 text-right">${diskVal}%</span>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-500">NET</span>
                  <div class="flex items-center gap-2">
                    <div class="w-16 h-1 bg-white/10"><div class="h-full bg-[#00d2ff]" style="width: ${netVal}%"></div></div>
                    <span class="text-white w-8 text-right">${netVal}%</span>
                  </div>
                </div>
              </div>
              <div class="mt-3 pt-2 border-t border-white/5 text-gray-500">UPTIME: <span class="text-[#4ade80]">${Math.floor(Math.random() * 99 + 1)}d</span></div>
            </div>
          </div>
        `;
        
      default:
        return `<div class="p-2 text-white">UNKNOWN WINDOW TYPE</div>`;
    }
  }

  private removeWindow(id: string): void {
    const windowIndex = this.windows.findIndex(w => w.id === id);
    if (windowIndex !== -1) {
      const window = this.windows[windowIndex];
      if (window) {
        // Extract video ID from window content to clean up used videos
        const iframe = window.element.querySelector('iframe');
        if (iframe) {
          const src = iframe.src;
          // Extract video ID from YouTube URL
          const videoIdMatch = src.match(/embed\/([a-zA-Z0-9_-]+)/);
          if (videoIdMatch) {
            const videoId = videoIdMatch[1];
            // Find the corresponding camera ID from our streams
            const cameraStreams = this.getFallbackCameraStreams();
            const matchingCamera = cameraStreams.find(camera => camera.streamUrl.includes(videoId || ''));
            if (matchingCamera) {
              this.usedVideoIds.delete(matchingCamera.id);
            }
          }
        }
        
        // Pop-out animation with bounce effect
        window.element.style.opacity = '0';
        window.element.style.transform = 'scale(0.8) translateY(-20px)';
        window.element.style.transition = 'all 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19)';
        
        setTimeout(() => {
          if (window) {
            // Remove position tracking for this window
            const windowRect = window.element.getBoundingClientRect();
            this.windowPositions = this.windowPositions.filter(pos => 
              !(Math.abs(pos.x - windowRect.left) < 5 && Math.abs(pos.y - windowRect.top) < 5)
            );
            
            window.element.remove();
            this.windows.splice(windowIndex, 1);
            this.updateStatusCounts();
            console.log(`Removed ambient window: ${id}`);
          }
        }, 400);
      }
    }
  }

  private updatePositionsOnResize(): void {
    // Update position tracking based on current window positions
    this.windowPositions = [];
    this.windows.forEach(window => {
      if (window.element) {
        const rect = window.element.getBoundingClientRect();
        this.windowPositions.push({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
    });
  }

  private updateStatusCounts(): void {
    const cameraCount = this.windows.filter(w => w.type === 'camera').length;
    const dataCount = this.windows.filter(w => w.type === 'data').length;
    const securityCount = this.windows.filter(w => w.type === 'security').length;
    const systemCount = this.windows.filter(w => w.type === 'system').length;
    
    const cameraEl = document.getElementById('camera-count');
    const dataEl = document.getElementById('data-count');
    const securityEl = document.getElementById('security-count');
    const systemEl = document.getElementById('system-count');
    
    if (cameraEl) cameraEl.textContent = cameraCount.toString();
    if (dataEl) dataEl.textContent = dataCount.toString();
    if (securityEl) securityEl.textContent = securityCount.toString();
    if (systemEl) systemEl.textContent = systemCount.toString();
  }

  private startWindowAnimation(): void {
    const animate = () => {
      if (!this.isActive) return;
      
      // Refresh camera feeds every 30 seconds for live updates
      this.windows.forEach(window => {
        if (window.type === 'camera' && Math.random() < 0.001) { // Very low chance per frame
          const img = window.element.querySelector('img');
          if (img) {
            // Add timestamp to force refresh
            const currentSrc = img.src.split('?')[0];
            img.src = currentSrc + '?t=' + Date.now();
          }
        }
      });
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  public destroy(): void {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.windowGenerationTimer) {
      clearTimeout(this.windowGenerationTimer);
    }
    this.windows.forEach(window => window.element.remove());
    this.windows = [];
  }
}

export function initSurveillanceWindows(): void {
  // Skip terminal / root — no ambient layer behind boot UI
  if (window.location.pathname === '/terminal' || window.location.pathname === '/') {
    return;
  }

  const mainContent =
    document.querySelector('#main-content') ??
    document.querySelector('.game-hud-right') ??
    document.querySelector('.nexus-main');
  if (mainContent) {
    const existingSurveillance = mainContent.querySelector('.surveillance-windows-container');
    if (!existingSurveillance) {
      const surveillance = new SurveillanceSystem(mainContent as HTMLElement);
      surveillance.initSurveillance();
    }
  }
}
