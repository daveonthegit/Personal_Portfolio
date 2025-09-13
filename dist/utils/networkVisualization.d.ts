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
    constructor(container: HTMLElement);
    generateNetwork(): void;
    private createNetworkOverlay;
    private generateNodes;
    private generateNodeLabel;
    private generateConnections;
    private shouldConnect;
    private createConnection;
    private createDataVisualizationElements;
    private createSurveillanceData;
    private startDataFlow;
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