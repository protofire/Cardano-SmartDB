// export const MongoAppliedRegistry: Map<string, any> = new Map();

import { RegistryManager } from "./registerManager.js";

// export function MongoAppliedFor(entityClasses: any[]) {
//     return function (target: any) {
//         for (const entityClass of entityClasses) {
//             if (!MongoAppliedRegistry.has(entityClass.className())) {
//                 MongoAppliedRegistry.set(entityClass.className(), target);
//                 console.error(`----- saved MongoAppliedFor for ${entityClass.className()} ----`);
//             } else {
//                 console.error(`----- already exist MongoAppliedFor for ${entityClass.className()} ----`);
//            }
//         }
//     };
// }

// // Overloaded get method to accept class or class name
// export function getFromMongoAppliedRegistry(key: string | any): any {
//     if (key.className) {
//         // If key is a function (class), get the class name
//         const className = key.className();
//         return MongoAppliedRegistry.get(className);
//     } else {
//         // If key is a string (class name), directly get from the registry
//         return MongoAppliedRegistry.get(key);
//     }
// }

export function PostgreSQLAppliedFor(entities: any[]) {
    return function (target: any) {
        entities.forEach(entity => {
            RegistryManager.register(entity.className(), target, 'postgreSQLApplied');
        });
    };
}
