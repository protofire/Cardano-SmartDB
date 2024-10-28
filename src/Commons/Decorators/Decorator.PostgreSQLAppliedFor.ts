import { RegistryManager } from "./registerManager.js";

export function PostgreSQLAppliedFor(entities: any[]) {
    return function (target: any) {
        entities.forEach(entity => {
            RegistryManager.register(entity.className(), target, 'postgreSQLApplied');
        });
    };
}
