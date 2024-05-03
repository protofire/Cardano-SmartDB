export const EntitiesRegistry: Map<any, any> = new Map();

export function asEntity() {
    return function (target: any) {
        EntitiesRegistry.set(target.className(), target);
    };
}