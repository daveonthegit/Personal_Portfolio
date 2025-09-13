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
        this.container = container;
    }
    generateNetwork() {
        this.createNetworkOverlay();
        this.generateNodes();
        this.generateConnections();
        this.createDataVisualizationElements();
        this.startDataFlow();
        this.isActive = true;
    }
    createNetworkOverlay() {
        const networkOverlay = document.createElement('div');
        networkOverlay.className = 'xiaoos-network-surveillance';
        networkOverlay.innerHTML = `
      <div class="surveillance-grid"></div>
      <div class="network-nodes-container"></div>
      <div class="network-connections-container"></div>
      <div class="data-packets-container"></div>
      <div class="surveillance-overlay"></div>
    `;
        this.container.appendChild(networkOverlay);
    }
    generateNodes() {
        // Generate more sophisticated node positions with different types
        const nodeConfigs = [
            { x: 8, y: 15, size: 'large', type: 'server' },
            { x: 20, y: 12, size: 'small', type: 'device' },
            { x: 35, y: 8, size: 'medium', type: 'router' },
            { x: 50, y: 5, size: 'large', type: 'server' },
            { x: 70, y: 10, size: 'medium', type: 'security' },
            { x: 85, y: 15, size: 'small', type: 'device' },
            { x: 92, y: 25, size: 'medium', type: 'router' },
            { x: 15, y: 35, size: 'small', type: 'device' },
            { x: 30, y: 40, size: 'medium', type: 'security' },
            { x: 55, y: 35, size: 'large', type: 'server' },
            { x: 75, y: 45, size: 'small', type: 'device' },
            { x: 90, y: 50, size: 'medium', type: 'router' },
            { x: 10, y: 65, size: 'small', type: 'device' },
            { x: 25, y: 70, size: 'medium', type: 'security' },
            { x: 45, y: 75, size: 'large', type: 'server' },
            { x: 65, y: 80, size: 'small', type: 'device' },
            { x: 80, y: 85, size: 'medium', type: 'router' },
            { x: 95, y: 90, size: 'small', type: 'device' },
        ];
        const nodesContainer = this.container.querySelector('.network-nodes-container');
        if (!nodesContainer)
            return;
        nodeConfigs.forEach((config, index) => {
            const node = document.createElement('div');
            node.className = `surveillance-node surveillance-node-${config.size} surveillance-node-${config.type}`;
            node.style.left = `${config.x}%`;
            node.style.top = `${config.y}%`;
            node.style.animationDelay = `${index * 0.3}s`;
            // Add node label
            const label = document.createElement('div');
            label.className = 'node-label';
            label.textContent = this.generateNodeLabel(config.type, index);
            node.appendChild(label);
            nodesContainer.appendChild(node);
            this.nodes.push({
                x: config.x,
                y: config.y,
                size: config.size,
                type: config.type,
                delay: index * 0.3,
                pulseIntensity: Math.random() * 0.5 + 0.5
            });
        });
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
    generateConnections() {
        const connectionsContainer = this.container.querySelector('.network-connections-container');
        if (!connectionsContainer)
            return;
        // Create connections between nearby nodes
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const node1 = this.nodes[i];
                const node2 = this.nodes[j];
                if (node1 && node2 && this.shouldConnect(node1, node2)) {
                    this.createConnection(node1, node2, connectionsContainer);
                }
            }
        }
    }
    shouldConnect(node1, node2) {
        const distance = Math.sqrt(Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2));
        // Different connection rules based on node types
        if (node1.type === 'server' || node2.type === 'server') {
            return distance < 40; // Servers connect to more nodes
        }
        else if (node1.type === 'router' || node2.type === 'router') {
            return distance < 35; // Routers have medium range
        }
        else {
            return distance < 25; // Regular devices have shorter range
        }
    }
    createConnection(start, end, container) {
        const connection = document.createElement('div');
        const deltaX = end.x - start.x;
        const deltaY = end.y - start.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        connection.className = 'surveillance-connection';
        connection.style.left = `${start.x}%`;
        connection.style.top = `${start.y}%`;
        connection.style.width = `${distance}%`;
        connection.style.transform = `rotate(${angle}deg)`;
        connection.style.transformOrigin = '0 0';
        connection.style.animationDelay = `${Math.random() * 3}s`;
        // Add data flow indicator
        const flowIndicator = document.createElement('div');
        flowIndicator.className = 'data-flow-indicator';
        connection.appendChild(flowIndicator);
        container.appendChild(connection);
    }
    createDataVisualizationElements() {
        // Add surveillance data elements
        this.createSurveillanceData(85, 75, '247', 'THREATS', 'DETECTED TODAY');
        this.createSurveillanceData(15, 65, '99.7', '%', 'SYSTEM UPTIME');
        this.createSurveillanceData(50, 25, '1.2K', 'NODES', 'MONITORED');
        this.createSurveillanceData(75, 90, 'xiaoOS', 'v2.1', 'SURVEILLANCE NET');
    }
    createSurveillanceData(x, y, value, unit, label) {
        const dataElement = document.createElement('div');
        dataElement.className = 'surveillance-data-element';
        dataElement.style.left = `${x}%`;
        dataElement.style.top = `${y}%`;
        dataElement.style.animationDelay = `${Math.random() * 2}s`;
        dataElement.innerHTML = `
      <div class="data-container">
        <div class="data-value">${value}</div>
        <div class="data-unit">${unit}</div>
        <div class="data-label">${label}</div>
        <div class="data-status-indicator"></div>
      </div>
    `;
        this.container.appendChild(dataElement);
    }
    startDataFlow() {
        const animate = () => {
            if (!this.isActive)
                return;
            this.updateDataPackets();
            this.animateConnections();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
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
        packet.element.className = `data-packet data-packet-${packet.type}`;
        packet.element.style.left = `${packet.startX}%`;
        packet.element.style.top = `${packet.startY}%`;
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
            'security': '🔒',
            'surveillance': '👁'
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
        const networkOverlay = this.container.querySelector('.xiaoos-network-surveillance');
        if (networkOverlay) {
            networkOverlay.remove();
        }
        this.dataPackets.forEach(packet => packet.element.remove());
        this.dataPackets = [];
    }
}
// Initialize xiaoOS network surveillance for all pages except terminal
export function initNetworkVisualization() {
    // Skip terminal page
    if (window.location.pathname === '/terminal' || window.location.pathname === '/') {
        return;
    }
    // Add network surveillance to main content area
    const mainContent = document.querySelector('.nexus-main');
    if (mainContent && !mainContent.querySelector('.xiaoos-network-surveillance')) {
        const visualization = new XiaoOSNetworkSurveillance(mainContent);
        visualization.generateNetwork();
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
            floatingData.className = 'surveillance-floating-data';
            floatingData.innerHTML = `
        <div class="surveillance-data-panel">
          <div class="panel-header">xiaoOS MONITOR</div>
          <div class="panel-content">
            <div>NODE_ID: ${String(index + 1).padStart(3, '0')}</div>
            <div>STATUS: <span class="status-active">ACTIVE</span></div>
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