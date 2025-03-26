import { ConversionFunctions } from '../types.js';

let globalState: any;

if (typeof window !== 'undefined') {
    // Client-side environment
    globalState = window;
} else {
    // Server-side environment (Node.js)
    globalState = global;
}

// registryManager.ts
export class RegistryManager {
    private entitiesRegistry: Map<string, any> = new Map();
    private smartDBEntitiesRegistry: Map<string, any> = new Map();
    private backEndAppliedRegistry: Map<string, any> = new Map();
    private backEndApiHandlersRegistry: Map<string, any> = new Map();
    private mongoSchemasRegistry: Map<string, any> = new Map();
    private postgreSQLModelsRegistry: Map<string, any> = new Map();

    private conversionFunctionsRegistry: Map<string, Map<string, ConversionFunctions<any>>> = new Map();

    private constructor() {}

    private static getInstance(): RegistryManager {
        if (!(globalState as any).registryManagerInstance) {
            (globalState as any).registryManagerInstance = new RegistryManager();
        }
        return (globalState as any).registryManagerInstance;
    }

    public static register(className: string, target: any, registryType: string): void {
        const registry = RegistryManager.getInstance().getRegistryFromType(registryType);
        if (!registry.has(className)) {
            registry.set(className, target);
            //console.log(`----- saved in registry ${registryType} for ${className} ----`);
        } else {
            //console.log(`----- already exists registry ${registryType} for ${className} ----`);
        }
    }

    public static getRegistry(className: string, registryType: string): any {
        const registry = RegistryManager.getInstance().getRegistryFromType(registryType);
        return registry.get(className);
    }

    public static getAllFromRegistry(registryType: string): Map<string, any> {
        return new Map(RegistryManager.getInstance().getRegistryFromType(registryType));
    }

    private getRegistryFromType(type: string): Map<string, any> {
        switch (type) {
            case 'entities':
                return this.entitiesRegistry;
            case 'smartDBEntities':
                return this.smartDBEntitiesRegistry;
            case 'backEndApplied':
                return this.backEndAppliedRegistry;
            case 'backEndApiHandlers':
                return this.backEndApiHandlersRegistry;
            case 'mongoSchemas':
                return this.mongoSchemasRegistry;
            case 'postgreSQLModels':
                return this.postgreSQLModelsRegistry;
            case 'conversionFunctions':
                return this.conversionFunctionsRegistry;
            default:
                throw `Unknown registry type: ${type}`;
        }
    }

    public static getFromEntitiesRegistry(className: string): any {
        return RegistryManager.getRegistry(className, 'entities');
    }

    public static getFromSmartDBEntitiesRegistry(className: string): any {
        return RegistryManager.getRegistry(className, 'smartDBEntities');
    }

    public static getFromBackEndAppliedRegistry(entity: any): any {
        return RegistryManager.getRegistry(entity.className(), 'backEndApplied');
    }

    public static getFromBackEndApiHandlersRegistry(entity: any): any {
        return RegistryManager.getRegistry(entity.className(), 'backEndApiHandlers');
    }

    public static getFromMongoSchemasRegistry(entity: any): any {
        return RegistryManager.getRegistry(entity.className(), 'mongoSchemas');
    }

    public static getFromPostgreSQLModelsRegistry(entity: any): any {
        return RegistryManager.getRegistry(entity.className(), 'postgreSQLModels');
    }

    public static getFromConversionFunctionsRegistry(className: string): Map<string, ConversionFunctions<any>> {
        return RegistryManager.getRegistry(className, 'conversionFunctions');
    }

    public static getAllFromEntitiesRegistry(): Map<string, any> {
        return new Map(RegistryManager.getInstance().getRegistryFromType('entities'));
    }

    public static getAllFromSmartDBEntitiesRegistry(): Map<string, any> {
        return new Map(RegistryManager.getInstance().getRegistryFromType('smartDBEntities'));
    }

    public static getAllFromBackEndAppliedRegistry(): Map<string, any> {
        return new Map(RegistryManager.getInstance().getRegistryFromType('backEndApplied'));
    }

    public static getAllFromBackEndApiHandlersRegistry(): Map<string, any> {
        return new Map(RegistryManager.getInstance().getRegistryFromType('backEndApiHandlers'));
    }

    public static getAllFromMongoSchemasRegistry(): Map<string, any> {
        return new Map(RegistryManager.getInstance().getRegistryFromType('mongoSchemas'));
    }

    public static getAllFromPosgreSQLModelsRegistry(): Map<string, any> {
        return new Map(RegistryManager.getInstance().getRegistryFromType('postgreSQLModels'));
    }
}
