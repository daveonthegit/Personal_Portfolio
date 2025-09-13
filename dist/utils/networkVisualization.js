/**
 * xiaoOS Network Surveillance Visualization
 * Creates authentic surveillance-style network patterns and data visualization
 * Inspired by CTOS but branded for xiaoOS
 */
class XiaoOSNetworkSurveillance {
    constructor(container) {
        this.nodes = [];
        this.dataPackets = [];
        this.animationId = null;
        this.isActive = false;
        this.nodeGenerationTimer = null;
        this.lastScrollY = 0;
        this.container = container;
        this.setupScrollListener();
    }
    generateNetwork() {
        console.log('🎯 generateNetwork() called');
        this.isActive = true; // Set active BEFORE starting generation
        console.log('✅ Network visualization is now active');
        this.createNetworkOverlay();
        console.log('✅ Network overlay created');
        this.generateInitialNodes();
        console.log('✅ Initial nodes generated');
        this.startDynamicNodeGeneration();
        console.log('✅ Dynamic node generation started');
        this.startDataFlow();
        console.log('✅ Data flow started');
    }
    setupScrollListener() {
        let ticking = false;
        const updateScrollPosition = () => {
            const scrollY = window.scrollY;
            const deltaY = scrollY - this.lastScrollY;
            // Calculate scroll factor based on page height
            const pageHeight = document.documentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            const maxScroll = pageHeight - viewportHeight;
            const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
            // Parallax effect based on page size - more movement for longer pages
            const parallaxFactor = Math.min(0.3, 0.1 + (scrollProgress * 0.2));
            // Update all network elements position based on scroll
            const networkOverlay = this.container.querySelector('.fixed.inset-0');
            if (networkOverlay) {
                networkOverlay.style.transform = `translateY(${deltaY * parallaxFactor}px)`;
            }
            this.lastScrollY = scrollY;
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollPosition);
                ticking = true;
            }
        });
    }
    createNetworkOverlay() {
        const networkOverlay = document.createElement('div');
        networkOverlay.className = 'fixed inset-0 pointer-events-none z-0 overflow-hidden';
        networkOverlay.innerHTML = `
      <!-- World Map Background -->
      <div class="absolute inset-0 opacity-20">
        <svg class="w-full h-full" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
          <path d="M150,200 Q200,180 250,200 Q300,190 350,200 Q400,185 450,200 Q500,195 550,200 Q600,190 650,200 Q700,185 750,200 Q800,195 850,200" 
                stroke="rgba(255,255,255,0.3)" stroke-width="1" fill="none" stroke-dasharray="2,2"/>
          <path d="M200,150 Q250,130 300,150 Q350,140 400,150 Q450,135 500,150 Q550,140 600,150 Q650,135 700,150" 
                stroke="rgba(255,255,255,0.3)" stroke-width="1" fill="none" stroke-dasharray="2,2"/>
          <path d="M100,300 Q150,280 200,300 Q250,290 300,300 Q350,285 400,300 Q450,295 500,300 Q550,290 600,300 Q650,285 700,300 Q750,295 800,300" 
                stroke="rgba(255,255,255,0.3)" stroke-width="1" fill="none" stroke-dasharray="2,2"/>
          <path d="M300,100 Q350,80 400,100 Q450,90 500,100 Q550,85 600,100 Q650,95 700,100" 
                stroke="rgba(255,255,255,0.3)" stroke-width="1" fill="none" stroke-dasharray="2,2"/>
          <path d="M200,400 Q250,380 300,400 Q350,390 400,400 Q450,385 500,400 Q550,395 600,400 Q650,390 700,400 Q750,385 800,400" 
                stroke="rgba(255,255,255,0.3)" stroke-width="1" fill="none" stroke-dasharray="2,2"/>
        </svg>
      </div>
      
      <!-- Grid Overlay -->
      <div class="absolute inset-0 opacity-10" style="background-image: linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 40px 40px;"></div>
      
      <!-- Network Containers -->
      <div class="network-nodes-container" style="z-index: 3;"></div>
      <div class="network-connections-container" style="z-index: 2;"></div>
      <div class="data-packets-container" style="z-index: 4;"></div>
      
      <!-- Surveillance Text Overlays -->
      <div class="absolute top-20 left-10 text-white/30 text-xs font-mono transform rotate-12">
        <div>the command line</div>
        <div>gradle-wrapper</div>
        <div>system_init</div>
      </div>
      <div class="absolute top-40 right-20 text-white/30 text-xs font-mono transform -rotate-6">
        <div>surveillance_net</div>
        <div>data_stream_247</div>
        <div>node_connect</div>
      </div>
      <div class="absolute bottom-32 left-1/4 text-white/30 text-xs font-mono transform rotate-3">
        <div>xiaoOS_v2.1</div>
        <div>threat_detected</div>
        <div>encryption_aes256</div>
      </div>
    `;
        this.container.appendChild(networkOverlay);
    }
    generateInitialNodes() {
        // Generate initial set of nodes
        console.log('🚀 Generating initial nodes...');
        for (let i = 0; i < 30; i++) {
            this.createRandomNode();
        }
        console.log(`✅ Generated ${this.nodes.length} initial nodes`);
    }
    startDynamicNodeGeneration() {
        console.log('🚀 Starting dynamic node generation...');
        // Start the first generation immediately
        const generateNewNode = () => {
            console.log(`🔄 Dynamic generation check - isActive: ${this.isActive}, nodes: ${this.nodes.length}`);
            if (this.isActive) {
                console.log('🔄 Generating new node...');
                this.createRandomNode();
                // Remove old nodes to keep network dynamic (max 50 nodes)
                if (this.nodes.length > 50) {
                    console.log('🗑️ Removing oldest node...');
                    this.removeOldestNode();
                }
                // Schedule next generation
                const nextDelay = Math.random() * 3000 + 2000; // 2-5 seconds
                console.log(`⏰ Scheduling next node generation in ${nextDelay.toFixed(0)}ms`);
                this.nodeGenerationTimer = window.setTimeout(generateNewNode, nextDelay);
            }
            else {
                console.log('❌ Dynamic generation stopped - isActive is false');
            }
        };
        // Start immediately
        generateNewNode();
    }
    createRandomNode() {
        // Hierarchical distribution: devices (40%) > routers (30%) > security (20%) > servers (10%)
        const typeWeights = [
            { type: 'device', weight: 40 },
            { type: 'router', weight: 30 },
            { type: 'security', weight: 20 },
            { type: 'server', weight: 10 }
        ];
        const randomType = this.getWeightedRandomType(typeWeights);
        // Size based on hierarchy: devices (smallest) > routers > security > servers (biggest)
        let nodeSize;
        switch (randomType) {
            case 'device':
                nodeSize = 'small';
                break;
            case 'router':
                nodeSize = 'medium';
                break;
            case 'security':
                nodeSize = 'medium';
                break;
            case 'server':
                nodeSize = 'large';
                break;
            default:
                nodeSize = 'small';
        }
        const config = {
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: nodeSize,
            type: randomType
        };
        console.log(`🎯 Creating ${randomType} node at (${config.x.toFixed(1)}, ${config.y.toFixed(1)})`);
        const nodesContainer = this.container.querySelector('.network-nodes-container');
        if (!nodesContainer) {
            console.log('❌ Nodes container not found!');
            return;
        }
        const node = document.createElement('div');
        const sizeClasses = {
            'small': 'w-2 h-2', // Devices - smallest
            'medium': 'w-4 h-4', // Routers & Security - medium
            'large': 'w-8 h-8' // Servers - largest
        };
        const typeColors = {
            'server': 'bg-red-500',
            'security': 'bg-yellow-500',
            'router': 'bg-green-500',
            'device': 'bg-blue-500'
        };
        node.className = `absolute rounded-full ${sizeClasses[nodeSize]} ${typeColors[randomType]} shadow-2xl`;
        node.style.left = `${config.x}%`;
        node.style.top = `${config.y}%`;
        node.style.animationDelay = `${Math.random() * 2}s`;
        node.style.transition = 'all 0.5s ease-in-out';
        const glowColors = {
            'server': 'rgba(239, 68, 68, 0.6)',
            'security': 'rgba(234, 179, 8, 0.6)',
            'router': 'rgba(34, 197, 94, 0.6)',
            'device': 'rgba(59, 130, 246, 0.6)'
        };
        // Glow intensity based on node size
        const glowIntensity = nodeSize === 'small' ? '8px' : nodeSize === 'medium' ? '15px' : '25px';
        const outerGlow = nodeSize === 'small' ? '16px' : nodeSize === 'medium' ? '30px' : '50px';
        node.style.boxShadow = `0 0 ${glowIntensity} ${glowColors[randomType]}, 0 0 ${outerGlow} ${glowColors[randomType]}`;
        // Add pulsing rings
        const ring1 = document.createElement('div');
        ring1.className = 'absolute inset-0 rounded-full border-2 border-white/30 animate-ping';
        ring1.style.animationDelay = `${Math.random() * 2}s`;
        ring1.style.animationDuration = '2s';
        const ring2 = document.createElement('div');
        ring2.className = 'absolute inset-0 rounded-full border border-white/20 animate-ping';
        ring2.style.animationDelay = `${Math.random() * 2 + 0.5}s`;
        ring2.style.animationDuration = '3s';
        ring2.style.transform = 'scale(1.5)';
        node.appendChild(ring1);
        node.appendChild(ring2);
        // Add node label
        const label = document.createElement('div');
        label.className = 'absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-mono text-white/60 whitespace-nowrap';
        label.textContent = this.generateNodeLabel(randomType, this.nodes.length);
        node.appendChild(label);
        nodesContainer.appendChild(node);
        const nodeData = {
            x: config.x,
            y: config.y,
            size: nodeSize,
            type: randomType,
            delay: Math.random() * 2,
            pulseIntensity: Math.random() * 0.5 + 0.5
        };
        this.nodes.push(nodeData);
        // Animate node appearance
        node.style.opacity = '0';
        node.style.transform = 'scale(0)';
        setTimeout(() => {
            node.style.opacity = '1';
            node.style.transform = 'scale(1)';
        }, 100);
    }
    removeOldestNode() {
        if (this.nodes.length === 0)
            return;
        const nodesContainer = this.container.querySelector('.network-nodes-container');
        if (!nodesContainer)
            return;
        const oldestNode = nodesContainer.children[0];
        if (oldestNode) {
            // Animate removal
            oldestNode.style.opacity = '0';
            oldestNode.style.transform = 'scale(0)';
            setTimeout(() => {
                oldestNode.remove();
            }, 500);
        }
        this.nodes.shift();
    }
    getWeightedRandomType(weights) {
        const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        for (const item of weights) {
            random -= item.weight;
            if (random <= 0) {
                return item.type;
            }
        }
        // Fallback to first type
        return weights[0]?.type || 'device';
    }
    generateNodeLabel(type, index) {
        const prefixes = {
            'server': 'SRV',
            'device': 'DEV',
            'router': 'RTR',
            'security': 'SEC'
        };
        return `${prefixes[type] || 'NODE'}-${String(index + 1).padStart(3, '0')}`;
    }
    updateConnections() {
        const connectionsContainer = this.container.querySelector('.network-connections-container');
        if (!connectionsContainer) {
            console.log('❌ Connections container not found!');
            return;
        }
        console.log(`🔄 Updating connections with ${this.nodes.length} nodes`);
        // Clear existing connections
        connectionsContainer.innerHTML = '';
        // Track which nodes already have parents to prevent multiple parents
        const hasParent = new Set();
        let connectionCount = 0;
        // Create connections in hierarchy order: Security -> Server -> Router -> Device
        const securityNodes = this.nodes.filter(n => n.type === 'security');
        const serverNodes = this.nodes.filter(n => n.type === 'server');
        const routerNodes = this.nodes.filter(n => n.type === 'router');
        const deviceNodes = this.nodes.filter(n => n.type === 'device');
        // Security to Server connections - EVERY server MUST connect to a security
        for (const server of serverNodes) {
            if (hasParent.has(serverNodes.indexOf(server)))
                continue;
            // Find closest security node
            let closestSecurity = null;
            let closestDistance = Infinity;
            for (const security of securityNodes) {
                const distance = Math.sqrt(Math.pow(server.x - security.x, 2) + Math.pow(server.y - security.y, 2));
                if (distance < closestDistance && distance < 30) {
                    closestDistance = distance;
                    closestSecurity = security;
                }
            }
            if (closestSecurity) {
                this.createConnection(closestSecurity, server, connectionsContainer);
                hasParent.add(serverNodes.indexOf(server));
                connectionCount++;
            }
        }
        // Server to Router connections - EVERY router MUST connect to a server
        for (const router of routerNodes) {
            if (hasParent.has(routerNodes.indexOf(router)))
                continue;
            // Find closest server node
            let closestServer = null;
            let closestDistance = Infinity;
            for (const server of serverNodes) {
                const distance = Math.sqrt(Math.pow(router.x - server.x, 2) + Math.pow(router.y - server.y, 2));
                if (distance < closestDistance && distance < 25) {
                    closestDistance = distance;
                    closestServer = server;
                }
            }
            if (closestServer) {
                this.createConnection(closestServer, router, connectionsContainer);
                hasParent.add(routerNodes.indexOf(router));
                connectionCount++;
            }
        }
        // Router to Device connections - EVERY device MUST connect to a router
        for (const device of deviceNodes) {
            if (hasParent.has(deviceNodes.indexOf(device)))
                continue;
            // Find closest router node
            let closestRouter = null;
            let closestDistance = Infinity;
            for (const router of routerNodes) {
                const distance = Math.sqrt(Math.pow(device.x - router.x, 2) + Math.pow(device.y - router.y, 2));
                if (distance < closestDistance && distance < 20) {
                    closestDistance = distance;
                    closestRouter = router;
                }
            }
            if (closestRouter) {
                this.createConnection(closestRouter, device, connectionsContainer);
                hasParent.add(deviceNodes.indexOf(device));
                connectionCount++;
            }
        }
        console.log(`🔗 Created ${connectionCount} connections between ${this.nodes.length} nodes`);
    }
    createConnection(start, end, container) {
        const deltaX = end.x - start.x;
        const deltaY = end.y - start.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        console.log(`🔗 Creating curved connection: ${start.type} to ${end.type}, distance: ${distance.toFixed(1)}`);
        // Create curved SVG connection
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '10';
        // Calculate control points for curved line
        const startX = start.x;
        const startY = start.y;
        const endX = end.x;
        const endY = end.y;
        // Control point for curve (offset perpendicular to line)
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const perpX = -(endY - startY) * 0.3; // Perpendicular offset
        const perpY = (endX - startX) * 0.3;
        const controlX = midX + perpX;
        const controlY = midY + perpY;
        // Create curved path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pathData = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', 'white');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', '0.8');
        path.style.filter = 'drop-shadow(0 0 8px rgba(255,255,255,0.8))';
        svg.appendChild(path);
        container.appendChild(svg);
        console.log(`✅ Curved connection added to DOM`);
    }
    startDataFlow() {
        const animate = () => {
            if (!this.isActive)
                return;
            this.updateDataPackets();
            this.updateConnections();
            this.animateConnections();
            this.updateNodePositions();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    updateNodePositions() {
        // Occasionally move nodes slightly to simulate network activity
        if (Math.random() < 0.01) { // 1% chance per frame
            const randomNodeIndex = Math.floor(Math.random() * this.nodes.length);
            if (this.nodes[randomNodeIndex]) {
                const node = this.nodes[randomNodeIndex];
                const nodesContainer = this.container.querySelector('.network-nodes-container');
                if (nodesContainer && nodesContainer.children[randomNodeIndex]) {
                    const nodeElement = nodesContainer.children[randomNodeIndex];
                    // Slight random movement
                    const deltaX = (Math.random() - 0.5) * 2; // -1 to 1
                    const deltaY = (Math.random() - 0.5) * 2; // -1 to 1
                    node.x = Math.max(0, Math.min(100, node.x + deltaX));
                    node.y = Math.max(0, Math.min(100, node.y + deltaY));
                    nodeElement.style.left = `${node.x}%`;
                    nodeElement.style.top = `${node.y}%`;
                }
            }
        }
    }
    updateDataPackets() {
        // Create new data packets occasionally
        if (Math.random() < 0.1 && this.dataPackets.length < 15) {
            this.createDataPacket();
        }
        // Update existing packets
        this.dataPackets.forEach((packet, index) => {
            this.animateDataPacket(packet);
            // Remove packets that have reached their destination
            if (packet.element.style.opacity === '0') {
                packet.element.remove();
                this.dataPackets.splice(index, 1);
            }
        });
    }
    createDataPacket() {
        if (this.nodes.length < 2)
            return;
        const startNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
        const endNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
        if (!startNode || !endNode || startNode === endNode)
            return;
        const packet = {
            id: `packet_${Date.now()}_${Math.random()}`,
            startX: startNode.x,
            startY: startNode.y,
            endX: endNode.x,
            endY: endNode.y,
            speed: Math.random() * 0.5 + 0.3,
            type: Math.random() < 0.3 ? 'security' : Math.random() < 0.6 ? 'surveillance' : 'data',
            element: document.createElement('div')
        };
        const packetClasses = {
            'data': 'text-blue-400',
            'security': 'text-yellow-400',
            'surveillance': 'text-red-400'
        };
        packet.element.className = `absolute text-lg ${packetClasses[packet.type]} animate-pulse`;
        packet.element.style.left = `${packet.startX}%`;
        packet.element.style.top = `${packet.startY}%`;
        packet.element.style.textShadow = '0 0 8px currentColor';
        packet.element.style.fontWeight = 'bold';
        packet.element.innerHTML = this.getPacketIcon(packet.type);
        const packetsContainer = this.container.querySelector('.data-packets-container');
        if (packetsContainer) {
            packetsContainer.appendChild(packet.element);
        }
        this.dataPackets.push(packet);
    }
    getPacketIcon(type) {
        const icons = {
            'data': '●',
            'security': '◆',
            'surveillance': '▲'
        };
        return icons[type] || '●';
    }
    animateDataPacket(packet) {
        const progress = parseFloat(packet.element.style.getPropertyValue('--progress') || '0');
        const newProgress = Math.min(progress + packet.speed * 0.02, 1);
        const currentX = packet.startX + (packet.endX - packet.startX) * newProgress;
        const currentY = packet.startY + (packet.endY - packet.startY) * newProgress;
        packet.element.style.left = `${currentX}%`;
        packet.element.style.top = `${currentY}%`;
        packet.element.style.setProperty('--progress', newProgress.toString());
        if (newProgress >= 1) {
            packet.element.style.opacity = '0';
        }
    }
    animateConnections() {
        const connections = this.container.querySelectorAll('.surveillance-connection');
        connections.forEach(connection => {
            const flowIndicator = connection.querySelector('.data-flow-indicator');
            if (flowIndicator) {
                const currentPosition = parseFloat(flowIndicator.style.getPropertyValue('--flow-position') || '0');
                const newPosition = (currentPosition + 0.01) % 1;
                flowIndicator.style.setProperty('--flow-position', newPosition.toString());
            }
        });
    }
    destroy() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.nodeGenerationTimer) {
            clearTimeout(this.nodeGenerationTimer);
        }
        const networkOverlay = this.container.querySelector('.fixed.inset-0');
        if (networkOverlay) {
            networkOverlay.remove();
        }
        this.dataPackets.forEach(packet => packet.element.remove());
        this.dataPackets = [];
        this.nodes = [];
    }
}
// Initialize xiaoOS network surveillance for all pages except terminal
export function initNetworkVisualization() {
    console.log('🔍 xiaoOS Network Surveillance - Initializing...');
    console.log('Current path:', window.location.pathname);
    // Skip terminal page
    if (window.location.pathname === '/terminal' || window.location.pathname === '/') {
        console.log('⏭️ Skipping network animation for terminal/root page');
        return;
    }
    // Add network surveillance to main content area
    const mainContent = document.querySelector('.nexus-main');
    console.log('Main content found:', !!mainContent);
    console.log('Main content element:', mainContent);
    if (mainContent) {
        const existingNetwork = mainContent.querySelector('.fixed.inset-0');
        console.log('Existing network found:', !!existingNetwork);
        if (!existingNetwork) {
            console.log('🎯 Creating xiaoOS Network Surveillance...');
            // Ensure main content has proper z-index to stay above background
            mainContent.classList.add('relative', 'z-10');
            const visualization = new XiaoOSNetworkSurveillance(mainContent);
            visualization.generateNetwork();
            console.log('✅ xiaoOS Network Surveillance created successfully');
        }
        else {
            console.log('⚠️ Network already exists, skipping creation');
        }
    }
    else {
        console.log('❌ Main content not found! Available elements:');
        console.log('All main elements:', document.querySelectorAll('main'));
        console.log('All elements with nexus class:', document.querySelectorAll('[class*="nexus"]'));
    }
}
// Create floating data elements for additional surveillance feel
export function createFloatingDataElements() {
    // Skip terminal page
    if (window.location.pathname === '/terminal' || window.location.pathname === '/') {
        return;
    }
    const sections = document.querySelectorAll('.section, .nexus-section');
    sections.forEach((section, index) => {
        if (index % 3 === 0) { // Every third section
            const floatingData = document.createElement('div');
            floatingData.className = 'absolute top-5 right-5 z-0 animate-pulse opacity-20';
            floatingData.innerHTML = `
        <div class="bg-black/70 border border-blue-400/20 rounded-md p-2 font-mono text-xs shadow-lg backdrop-blur-sm">
          <div class="text-green-400 font-bold mb-1 text-center border-b border-blue-400/20 pb-1">xiaoOS MONITOR</div>
          <div class="text-gray-400 space-y-1">
            <div>NODE_ID: ${String(index + 1).padStart(3, '0')}</div>
            <div>STATUS: <span class="text-green-400 font-semibold">ACTIVE</span></div>
          <div>UPTIME: 99.${90 + index}%</div>
            <div>THREATS: ${Math.floor(Math.random() * 50)}</div>
          </div>
        </div>
      `;
            if (section.firstChild) {
                section.insertBefore(floatingData, section.firstChild);
            }
        }
    });
}
export default XiaoOSNetworkSurveillance;
//# sourceMappingURL=networkVisualization.js.map