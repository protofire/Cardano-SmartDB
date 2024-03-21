export const MongoAppliedRegistry: Map<any, any> = new Map();

export function MongoAppliedFor(entityClasses: any[]) {
    return function (target: any) {
        for (const entityClass of entityClasses) {
            if (!MongoAppliedRegistry.has(entityClass)) {
                MongoAppliedRegistry.set(entityClass, target);
                // console.error(`----- saved MongoAppliedFor for ${entityClass.name} ----`);
            } else {
                // console.error(`----- already exist MongoAppliedFor for ${entityClass.name} ----`);
           }
        }
    };
}
