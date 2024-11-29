// src/Commons/BackEnd/globalConfig.ts

import { PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER, PUBLIC_ENDPOINTS_FROM_INTERNET } from '../Constants/endpoints.js';
import { WalletEntity } from '../../Entities/Wallet.Entity.js';

let globalState: any;

if (typeof window !== 'undefined') {
    globalState = window;
} else {
    globalState = global;
}

export class ConfigManager {
    private _walletEntityClass: any;
    private endPointsLocal: RegExp[] = PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER;
    private endPointsInternet: RegExp[] = PUBLIC_ENDPOINTS_FROM_INTERNET;

    constructor() {
        this._walletEntityClass = WalletEntity; // Default WalletEntity
    }

    // Wallet Entity Configuration
    public setWalletEntityClass(entityClass: any) {
        this._walletEntityClass = entityClass;
    }

    public getWalletEntityClass() {
        return this._walletEntityClass;
    }

    // Endpoints Configuration
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

interface GlobalConfig {
    config: ConfigManager;
}

if (!globalState.globalConfig) {
    globalState.globalConfig = {
        config: new ConfigManager()
    } as GlobalConfig;
}

export const globalConfig = globalState.globalConfig;

export function getGlobalConfig(): ConfigManager {
    return globalConfig.config;
}