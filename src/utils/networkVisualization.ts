/**
 * CTOS Network Visualization Generator
 * Creates authentic Watch Dogs style network patterns and data visualization
 */

interface NetworkNode {
  x: number;
  y: number;
  size: 'small' | 'large';
  delay: number;
}


class CTOSNetworkVisualization {
  private container: HTMLElement;
  private nodes: NetworkNode[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public generateNetwork(): void {
    this.createNetworkOverlay();
    this.generateNodes();
    this.generateConnections();
    this.createDataVisualizationElements();
  }

  private createNetworkOverlay(): void {
    const networkOverlay = document.createElement('div');
    networkOverlay.className = 'ctos-network';
    this.container.appendChild(networkOverlay);
  }

  private generateNodes(): void {
    // Generate strategic node positions
    const nodePositions = [
      { x: 10, y: 20, size: 'large' as const },
      { x: 25, y: 15, size: 'small' as const },
      { x: 75, y: 25, size: 'large' as const },
      { x: 90, y: 80, size: 'small' as const },
      { x: 15, y: 85, size: 'small' as const },
      { x: 60, y: 70, size: 'large' as const },
      { x: 40, y: 45, size: 'small' as const },
      { x: 85, y: 15, size: 'small' as const },
    ];

    nodePositions.forEach((pos, index) => {
      const node = document.createElement('div');
      node.className = `network-node ${pos.size === 'large' ? 'network-node-large' : ''}`;
      node.style.left = `${pos.x}%`;
      node.style.top = `${pos.y}%`;
      node.style.animationDelay = `${index * 0.5}s`;
      
      const networkOverlay = this.container.querySelector('.ctos-network');
      if (networkOverlay) {
        networkOverlay.appendChild(node);
      }

      this.nodes.push({
        x: pos.x,
        y: pos.y,
        size: pos.size,
        delay: index * 0.5
      });
    });
  }

  private generateConnections(): void {
    // Create connections between nearby nodes
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const node1 = this.nodes[i];
      const node2 = this.nodes[i + 1];
      
      if (node1 && node2 && this.shouldConnect(node1, node2)) {
        this.createConnection(node1, node2);
      }
    }
  }

  private shouldConnect(node1: NetworkNode, node2: NetworkNode): boolean {
    const distance = Math.sqrt(
      Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2)
    );
    return distance < 50; // Connect nodes within 50% distance
  }

  private createConnection(start: NetworkNode, end: NetworkNode): void {
    const connection = document.createElement('div');
    const networkOverlay = this.container.querySelector('.ctos-network');
    
    if (!networkOverlay) return;

    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    connection.className = 'network-connection';
    connection.style.left = `${start.x}%`;
    connection.style.top = `${start.y}%`;
    connection.style.width = `${distance}%`;
    connection.style.transform = `rotate(${angle}deg)`;
    connection.style.transformOrigin = '0 0';
    connection.style.animationDelay = `${Math.random() * 2}s`;

    networkOverlay.appendChild(connection);
  }

  private createDataVisualizationElements(): void {
    // Add some data circles like in the reference images
    this.createDataCircle(85, 75, '45', 'MINS', 'AVERAGE COMMUTE TIME');
    this.createDataCircle(15, 65, '5', '%', 'DELAYED TRAINS');
  }

  private createDataCircle(x: number, y: number, value: string, unit: string, label: string): void {
    const circle = document.createElement('div');
    circle.className = 'data-circle';
    circle.style.position = 'absolute';
    circle.style.left = `${x}%`;
    circle.style.top = `${y}%`;
    circle.style.transform = 'translate(-50%, -50%)';
    circle.style.zIndex = '10';

    circle.innerHTML = `
      <div class="text-center">
        <div class="data-value-large">${value}</div>
        <div class="data-label-small" style="color: #60a5fa; margin-top: -5px;">${unit}</div>
        <div class="data-label-small" style="margin-top: 5px; max-width: 80px; line-height: 1.2;">
          ${label}
        </div>
      </div>
    `;

    this.container.appendChild(circle);
  }

  public destroy(): void {
    const networkOverlay = this.container.querySelector('.ctos-network');
    const dataCircles = this.container.querySelectorAll('.data-circle');
    
    if (networkOverlay) {
      networkOverlay.remove();
    }
    
    dataCircles.forEach(circle => circle.remove());
  }
}

// Initialize network visualization for all sections
export function initNetworkVisualization(): void {
  const sections = document.querySelectorAll('.hero-section, .section');
  const processedSections = new Set<HTMLElement>();
  
  sections.forEach((section) => {
    const sectionElement = section as HTMLElement;
    
    // Skip if already processed or has network visualization
    if (processedSections.has(sectionElement) || sectionElement.querySelector('.ctos-network')) {
      return;
    }
    
    // Mark as processed
    processedSections.add(sectionElement);
    
    // Add network visualization
    const visualization = new CTOSNetworkVisualization(sectionElement);
    visualization.generateNetwork();
  });
}

// Create floating data elements
export function createFloatingDataElements(): void {
  const sections = document.querySelectorAll('.section');
  
  sections.forEach((section, index) => {
    if (index % 2 === 0) { // Every other section
      const floatingData = document.createElement('div');
      floatingData.className = 'absolute top-10 right-10 opacity-30';
      floatingData.innerHTML = `
        <div class="text-blue-400 font-mono text-xs">
          <div>SYSTEM_ID: ${String(index + 1).padStart(3, '0')}</div>
          <div>STATUS: OPERATIONAL</div>
          <div>UPTIME: 99.${90 + index}%</div>
        </div>
      `;
      
      if (section.firstChild) {
        section.insertBefore(floatingData, section.firstChild);
      }
    }
  });
}

export default CTOSNetworkVisualization;
