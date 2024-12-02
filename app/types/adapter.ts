export interface DataAdapter {
    initialize(): Promise<void>;
    fetchData(): Promise<any[]>;
    cleanup(): Promise<void>;
    subscribe?(callback: (data: any[]) => void): void;
    unsubscribe?(): void;
}