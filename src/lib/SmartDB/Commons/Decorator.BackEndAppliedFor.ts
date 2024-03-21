export const BackEndAppliedRegistry: Map<any, any> = new Map();

export function BackEndAppliedFor(entityClass: any) {
    return function (target: any) {
        if (!BackEndAppliedRegistry.has(entityClass)) {
            BackEndAppliedRegistry.set(entityClass, target);
            // console.error(`----- saved BackEndApplied for ${entityClass.name} ----`);
        } else {
            // console.error(`----- already exist BackEndApplied for ${entityClass.name} ----`);
        }
    };
}
