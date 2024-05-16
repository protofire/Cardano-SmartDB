// export const BackEndAppliedRegistry: Map<string, any> = new Map();
// export const BackEndApiHandlersRegistry: Map<string, any> = new Map();

import { RegistryManager } from "./registerManager.js";

// export function BackEndAppliedFor(entityClass: any) {
//     return function (target: any) {
//         if (!BackEndAppliedRegistry.has(entityClass.className())) {
//             BackEndAppliedRegistry.set(entityClass.className(), target);
//             console.error(`----- saved BackEndApplied for ${entityClass.className()} ----`);
//         } else {
//             console.error(`----- already exist BackEndApplied for ${entityClass.className()} ----`);
//         }
//     };
// }

// // Overloaded get method to accept class or class name for BackEndAppliedRegistry
// export function getFromBackEndAppliedRegistry(key: string | any): any {
//     if (key.className) {
//         // If key is a function (class), get the class name
//         const className = key.className();
//         return BackEndAppliedRegistry.get(className);
//     } else {
//         // If key is a string (class name), directly get from the registry
//         return BackEndAppliedRegistry.get(key);
//     }
// }

// export function BackEndApiHandlersFor(entityClass: any) {
//     return function (target: any) {
//         if (!BackEndApiHandlersRegistry.has(entityClass.className())) {
//             BackEndApiHandlersRegistry.set(entityClass.className(), target);
//             console.error(`----- saved BackEndApiHandlersFor for ${entityClass.className()} ----`);
//         } else {
//             console.error(`----- already exist BackEndApiHandlersFor for ${entityClass.className()} ----`);
//         }
//     };
// }

// // Overloaded get method to accept class or class name for BackEndApiHandlersRegistry
// export function getFromBackEndApiHandlersRegistry(key: string | any): any {
//     if (key.className) {
//         // If key is a function (class), get the class name
//         const className = key.className();
//         return BackEndApiHandlersRegistry.get(className);
//     } else {
//         // If key is a string (class name), directly get from the registry
//         return BackEndApiHandlersRegistry.get(key);
//     }
// }




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
