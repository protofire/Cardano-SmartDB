export const SmartDBEntitiesRegistry: Map<any, any> = new Map();

export function asSmartDBEntity() {
    return function (target: any) {
        SmartDBEntitiesRegistry.set(target.className(), target);
    };
}