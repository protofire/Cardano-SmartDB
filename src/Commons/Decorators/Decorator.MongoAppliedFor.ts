import { RegistryManager } from "./registerManager.js";

export function MongoAppliedFor(entities: any[]) {
    return function (target: any) {
        entities.forEach(entity => {
            RegistryManager.register(entity.className(), target, 'mongoApplied');
        });
    };
}
