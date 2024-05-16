// export const SmartDBEntitiesRegistry: Map<string, any> = new Map();

import { RegistryManager } from "./registerManager.js";

// export function asSmartDBEntity() {
//     return function (target: any) {
//         SmartDBEntitiesRegistry.set(target.className(), target);
//         if (!SmartDBEntitiesRegistry.has(target.className())) {
//             SmartDBEntitiesRegistry.set(target.className(), target);
//             console.error(`----- saved SmartDBEntitiesRegistry for ${target.className()} ----`);
//         } else {
//             console.error(`----- already exist SmartDBEntitiesRegistry for ${target.className()} ----`);
//         }
//     };
// }

export function asSmartDBEntity() {
    return function (target: any) {
        RegistryManager.register(target.className(), target, 'smartDBEntities');
    };
}
