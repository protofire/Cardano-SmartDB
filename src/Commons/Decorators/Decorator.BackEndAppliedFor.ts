import { RegistryManager } from "./registerManager.js";

export function BackEndAppliedFor(entity: any) {
    return function (target: any) {
        RegistryManager.register(entity.className(), target, 'backEndApplied');
    };
}

export function BackEndApiHandlersFor(entity: any) {
    return function (target: any) {
        RegistryManager.register(entity.className(), target, 'backEndApiHandlers');
    };
}
