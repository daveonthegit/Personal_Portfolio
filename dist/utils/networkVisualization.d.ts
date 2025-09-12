/**
 * CTOS Network Visualization Generator
 * Creates authentic Watch Dogs style network patterns and data visualization
 */
declare class CTOSNetworkVisualization {
    private container;
    private nodes;
    constructor(container: HTMLElement);
    generateNetwork(): void;
    private createNetworkOverlay;
    private generateNodes;
    private generateConnections;
    private shouldConnect;
    private createConnection;
    private createDataVisualizationElements;
    private createDataCircle;
    destroy(): void;
}
export declare function initNetworkVisualization(): void;
export declare function createFloatingDataElements(): void;
export default CTOSNetworkVisualization;
//# sourceMappingURL=networkVisualization.d.ts.map