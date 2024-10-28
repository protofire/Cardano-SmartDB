import { RegistryManager } from "./registerManager.js";

export function asSmartDBEntity() {
    return function (target: any) {
        RegistryManager.register(target.className(), target, 'smartDBEntities');
    };
}
