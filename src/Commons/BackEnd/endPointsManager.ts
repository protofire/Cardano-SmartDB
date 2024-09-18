import { PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER, PUBLIC_ENDPOINTS_FROM_INTERNET } from '../Constants/endpoints.js';


let globalState: any;

if (typeof window !== 'undefined') {
    // Client-side environment
    globalState = window;
} else {
    // Server-side environment (Node.js)
    globalState = global;
}


export class EndpointsManager {
    // private static instance: EndpointsManager;
    
    private endPointsLocal: RegExp[] = PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER;
    private endPointsInternet: RegExp[] = PUBLIC_ENDPOINTS_FROM_INTERNET;

    private constructor() {}

    public static getInstance(): EndpointsManager {
        if (!(globalState as any).endpointsManagerInstance) {
            (globalState as any).endpointsManagerInstance = new EndpointsManager();
        }
        return (globalState as any).endpointsManagerInstance;
    }

    public getPublicEndPointsLocal(): RegExp[] {
        return this.endPointsLocal;
    }

    public getPublicEndPointsInternet(): RegExp[] {
        return this.endPointsInternet;
    }

    public setPublicEndPointsLocal(endpoints: RegExp[], merge: boolean = true): void {
        if (merge) {
            this.endPointsLocal = this.mergeUnique(this.endPointsLocal, endpoints);
        } else {
            this.endPointsLocal = this.ensureUnique(endpoints);
        }
    }

    public setPublicEndPointsInternet(endpoints: RegExp[], merge: boolean = true): void {
        if (merge) {
            this.endPointsInternet = this.mergeUnique(this.endPointsInternet, endpoints);
        } else {
            this.endPointsInternet = this.ensureUnique(endpoints);
        }
    }

    private mergeUnique(currentEndpoints: RegExp[], newEndpoints: RegExp[]): RegExp[] {
        const patternSet = new Set(currentEndpoints.map((ep) => ep.source));
        newEndpoints.forEach((ep) => {
            if (!patternSet.has(ep.source)) {
                currentEndpoints.push(ep);
                patternSet.add(ep.source);
            }
        });
        return currentEndpoints;
    }

    private ensureUnique(endpoints: RegExp[]): RegExp[] {
        const patternSet = new Set();
        const uniqueEndpoints: RegExp[] = [];
        endpoints.forEach((ep) => {
            if (!patternSet.has(ep.source)) {
                uniqueEndpoints.push(ep);
                patternSet.add(ep.source);
            }
        });
        return uniqueEndpoints;
    }
}
