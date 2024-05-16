// export const EntitiesRegistry: Map<string, any> = new Map();

import { RegistryManager } from "./registerManager.js";

//import { RegistryManager } from "./registerManager.js";

// export function asEntity() {
//     return function (target: any) {
//         if (!EntitiesRegistry.has(target.className())) {
//             EntitiesRegistry.set(target.className(), target);
//             console.error(`----- saved EntitiesRegistry for ${target.className()} ----`);
//         } else {
//             console.error(`----- already exist EntitiesRegistry for ${target.className()} ----`);
//         }
//     };
// }


export function asEntity() {
    return function (target: any) {
        RegistryManager.register(target.className(), target, 'entities');
    };
}