/**
 * xiaoOS Network Surveillance Visualization
 * Creates authentic surveillance-style network patterns and data visualization
 * Inspired by CTOS but branded for xiaoOS
 */
declare class XiaoOSNetworkSurveillance {
    private container;
    private nodes;
    private dataPackets;
    private animationId;
    private isActive;
    private nodeGenerationTimer;
    private lastScrollY;
    constructor(container: HTMLElement);
    generateNetwork(): void;
    private setupScrollListener;
    private createNetworkOverlay;
    private generateInitialNodes;
    private startDynamicNodeGeneration;
    private createRandomNode;
    private removeOldestNode;
    private getWeightedRandomType;
    private generateNodeLabel;
    private updateConnections;
    private createConnection;
    private startDataFlow;
    private updateNodePositions;
    private updateDataPackets;
    private createDataPacket;
    private getPacketIcon;
    private animateDataPacket;
    private animateConnections;
    destroy(): void;
}
export declare function initNetworkVisualization(): void;
export declare function createFloatingDataElements(): void;
export default XiaoOSNetworkSurveillance;
//# sourceMappingURL=networkVisualization.d.ts.map