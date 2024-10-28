import { RegistryManager } from "./registerManager.js";

export function asEntity() {
    return function (target: any) {
        RegistryManager.register(target.className(), target, 'entities');
    };
}