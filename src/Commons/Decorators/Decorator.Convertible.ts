import 'reflect-metadata';
import { ConversionFunctions } from '../types.js';
import { RegistryManager } from './registerManager.js';

// interface GlobalConversions {
//     conversionFunctionsByClass: Map<Function, Map<string, ConversionFunctions<any>>>;
// }

// let globalState: any;

// if (typeof window !== 'undefined') {
//     globalState = window;
// } else {
//     globalState = global;
// }

// if (!globalState.globalConversions) {
//     globalState.globalConversions = {
//         conversionFunctionsByClass: new Map<Function, Map<string, ConversionFunctions<any>>>(),
//     } as GlobalConversions;
// }

// export const conversionFunctionsByClass = globalState.globalConversions.conversionFunctionsByClass as Map<Function, Map<string, ConversionFunctions<any>>>;

export function Convertible<T>(conversions: ConversionFunctions<T> = {}) {
    const result = function (target: any, propertyKey: string): void {
        //------------------------
        const targetName = target.className ? target.className() : target.name ? target.name : target.constructor.name;
        if (targetName === undefined) {
            console.error(`[Convertible] target Name is undefined`);
        }
        //------------------------
        const reflectedType = Reflect.getMetadata(`design:type`, target, propertyKey);
        const isArray = reflectedType === Array || conversions.isArray;
        let type: any = undefined;
        //------------------------
        if (isArray) {
            if (conversions.type === undefined && conversions.relation !== `OneToMany`) {
                throw `${targetName}: [Convertible] ${propertyKey} is Array, you must set type`;
            }
            type = conversions.type;
        } else {
            type = conversions.type ? conversions.type : reflectedType;
        }
        //------------------------
        if (conversions.relation === `OneToOne`) {
            // OneToOne es una relacion de un registro de una tabla con un registro de otra tabla
            if (conversions.typeRelation === undefined) {
                throw `${targetName}: [Convertible] ${propertyKey}: OneToOne must have relation type`;
            }
            if (conversions.propertyToFill === undefined) {
                // de hecho no los voy a usar desde aji
                // a partir de los id yo mismo voy a cargarlos desde la base si cascade load esta activado
                // no se supone que vengan en la interfas los objetos
                throw `${targetName}: [Convertible] ${propertyKey}: OneToOne must have a valid propertyToFill`;
            }
        } else if (conversions.relation === `ManyToOne`) {
            // ManyToOne es una relacion de muchos registros de una tabla con un registro de otra tabla
            if (conversions.typeRelation === undefined) {
                throw `${targetName}: [Convertible] ${propertyKey}: ManyToOne must have relation type`;
            }
            if (conversions.propertyToFill === undefined) {
                // de hecho no los voy a usar desde aji
                // a partir de los id yo mismo voy a cargarlos desde la base si cascade load esta activado
                // no se supone que vengan en la interfas los objetos
                throw `${targetName}: [Convertible] ${propertyKey}: ManyToOne must have a valid propertyToFill`;
            }
        } else if (conversions.relation === `OneToMany`) {
            // OneToMany es una relacion un registro de esta tabla se relaciona con muchos registros de otra tabla
            if (isArray === false) {
                throw `${targetName}: [Convertible] ${propertyKey}: OneToMany must be an Array`;
            }
            if (conversions.typeRelation === undefined) {
                throw `${targetName}: [Convertible] ${propertyKey}: OneToMany must have relation type`;
            }
            if (conversions.propertyToFill === undefined) {
                throw `${targetName}: [Convertible] ${propertyKey}: OneToMany must have a valid propertyToFill`;
            }
        }
        //------------------------
        // let conversionFunctionsByProperty = getConversionFunctions(target.constructor) as Map<string, ConversionFunctions<any>> | undefined;
        // if (!conversionFunctionsByProperty) {
        //     conversionFunctionsByProperty = new Map<string, ConversionFunctions<any>>();
        //     conversionFunctionsByClass.set(target.constructor, conversionFunctionsByProperty);
        // }
        //------------------------
        let conversionFunctionsByProperty = RegistryManager.getFromConversionFunctionsRegistry(targetName);
        if (!conversionFunctionsByProperty) {
            conversionFunctionsByProperty = new Map<string, ConversionFunctions<any>>();
            RegistryManager.register(targetName, conversionFunctionsByProperty, 'conversionFunctions');
        }
        //------------------------
        conversionFunctionsByProperty.set(propertyKey, { ...conversions, type, isArray });
        //------------------------
    };

    return result;
}

//------------------------
// function getConversionFunctions<T>(target: Function): Map<string, ConversionFunctions<T>> | undefined {
//     // First try a direct match
//     // let conversionFunctions = conversionFunctionsByClass.get(target);
//     // Si no hay coincidencia directa, hacemos comparación completa
//     if (!conversionFunctions) {
//         const key = [...conversionFunctionsByClass.keys()].find(
//             (k) => isSameClass(target, k)
//         );
//         if (key) {
//             conversionFunctions = conversionFunctionsByClass.get(key);
//             // console.log(`✅ Found conversion functions using areClassesEquivalent for ${target.name}`);
//         }
//     }
//     // // If direct match fails, try resolving using instanceof
//     // if (!conversionFunctions) {
//     //     const key = [...conversionFunctionsByClass.keys()].find((k) => target.prototype instanceof k);
//     //     if (key) {
//     //         conversionFunctions = conversionFunctionsByClass.get(key);
//     //         console.log(`✅ Found conversion functions using instanceof for ${target.name}`);
//     //     }
//     // }

//     return conversionFunctions;
// }
//------------------------

export function getCombinedConversionFunctions<T>(target: any): Map<string, ConversionFunctions<any>> {
    //------------------------
    const combinedConversionFunctions = new Map<string, ConversionFunctions<any>>();
    //------------------------
    let currentTarget = target;
    //------------------------
    while (currentTarget && currentTarget !== Object) {
        //------------------------
        //TODO: fixme: no estoy usando Mixin en las clases con decorators al menos por ahora.
        // UPDATE: si uso Misin
        // asi que todo esto no aplica
        //------------------------
        const currentTargetName = currentTarget.className ? currentTarget.className() : currentTarget.name ? currentTarget.name : currentTarget.constructor.name;
        if (currentTargetName === undefined) {
            console.error(`[Convertible] currentTarget Name is undefined`);
        }
        //------------------------
        if (Object.getPrototypeOf(currentTarget.prototype)?.constructor.name === 'MixedClass') {
            //------------------------
            if (Array.isArray((currentTarget as any)._MixinClassesHierarchy) === false || (currentTarget as any)._MixinClassesHierarchy.length === 0) {
                throw `[Convertible] MixedClass must define _MixinClassesHierarchy array with at least one class element`;
            }
            //------------------------
            // cargo los decoratos de esta clase mixin
            const conversionFunctionsByProperty = RegistryManager.getFromConversionFunctionsRegistry(currentTargetName);
            // const conversionFunctionsByProperty = getConversionFunctions(currentTarget);
            // const conversionFunctionsByProperty = conversionFunctionsByClass.get(currentTarget);
            //------------------------
            if (conversionFunctionsByProperty) {
                for (const [propertyKey, conversionFunctions] of conversionFunctionsByProperty.entries()) {
                    if (!combinedConversionFunctions.has(propertyKey)) {
                        combinedConversionFunctions.set(propertyKey, conversionFunctions);
                    }
                }
            }
            //------------------------
            // cargo los decoratos en orden de las clases definidas en el array
            //------------------------
            const listOfClassesWithDecoratos = (currentTarget as any)._MixinClassesHierarchy.reverse();
            //------------------------
            for (const classFunction of listOfClassesWithDecoratos) {
                const classFunctionName = classFunction.className ? classFunction.className() : classFunction.name ? classFunction.name : classFunction.constructor.name;
                if (classFunctionName === undefined) {
                    console.error(`[Convertible] classFunction Name is undefined`);
                }
                const conversionFunctionsByProperty = RegistryManager.getFromConversionFunctionsRegistry(classFunctionName);
                // const conversionFunctionsByProperty = getConversionFunctions(classFunction);
                // const conversionFunctionsByProperty = conversionFunctionsByClass.get(classFunction);
                if (conversionFunctionsByProperty) {
                    for (const [propertyKey, conversionFunctions] of conversionFunctionsByProperty.entries()) {
                        if (!combinedConversionFunctions.has(propertyKey)) {
                            combinedConversionFunctions.set(propertyKey, conversionFunctions);
                        }
                    }
                }
            }
            //------------------------
            //TODO: comprobar si esta bien, logica y tecnica
            // la logica aun no la tengo clara, cual cadena de prototipo quiero seguir para buscar y definir conversion functions?
            // por ahora dejo que use la ultima de la lista
            // tampoco se si la forma de hacerlo sería asi
            //------------------------
            currentTarget = Object.getPrototypeOf(listOfClassesWithDecoratos[0].prototype)?.constructor;
            // luego se hace de neuvo esta isntruccion para ir a la clase que si corresponde
            //------------------------
        } else {
            //------------------------
            // cargo decorators de esta clase
            const conversionFunctionsByProperty = RegistryManager.getFromConversionFunctionsRegistry(currentTargetName);
            // const conversionFunctionsByProperty = getConversionFunctions(currentTarget);
            // const conversionFunctionsByProperty = conversionFunctionsByClass.get(currentTarget);
            //------------------------
            if (conversionFunctionsByProperty) {
                for (const [propertyKey, conversionFunctions] of conversionFunctionsByProperty.entries()) {
                    if (!combinedConversionFunctions.has(propertyKey)) {
                        combinedConversionFunctions.set(propertyKey, conversionFunctions);
                    }
                }
            }
            //------------------------
        }
        //------------------------
        // subo una clase y vuelvo a empezar a buscar decoratos
        currentTarget = Object.getPrototypeOf(currentTarget.prototype)?.constructor;
        //------------------------
    }
    //------------------------
    if (combinedConversionFunctions === undefined || combinedConversionFunctions.size === 0) {
        // console.log(`No conversion functions found for ${target.name}`);
        // conversionFunctionsByClass.forEach((_, key) => console.log((key as any).name));
        // conversionFunctionsByClass.forEach((_, key) => console.log(key === target, key, target));
        // const conversionFunctionsByProperty = getConversionFunctions(target);
        // console.log(`conversionFunctionsByProperty`, conversionFunctionsByProperty);
        // console.log(`currentTarget`, target);
        // throw `No conversion functions found for ${target.name}`;
    }
    //------------------------
    return combinedConversionFunctions;
}

// Examples:

// const createdAtFields = getFilteredConversionFunctions(Entity, (conversion) => conversion.isCreatedAt === true);
// for (const [propertyKey, conversion] of createdAtFields.entries()) {
//     console.log(`Field with @CreatedAt: ${propertyKey}`);
// }

// const updatedAtFields = getFilteredConversionFunctions(Entity, (conversion) => conversion.isUpdatedAt === true);
// for (const [propertyKey, conversion] of updatedAtFields.entries()) {
//     console.log(`Field with @UpdatedAt: ${propertyKey}`);
// }

// const bigintFields = getFilteredConversionFunctions(Entity, (conversion) => conversion.type === BigInt);
// for (const [propertyKey, conversion] of bigintFields.entries()) {
//     console.log(`BigInt field: ${propertyKey}`);
// }

export function getFilteredConversionFunctions<T>(
    target: any,
    filterFn: (conversion: ConversionFunctions<any>, propertyKey: string) => boolean
): Map<string, ConversionFunctions<any>> {
    const combinedConversionFunctions = getCombinedConversionFunctions(target);
    const filteredConversionFunctions = new Map<string, ConversionFunctions<any>>();

    for (const [propertyKey, conversion] of combinedConversionFunctions.entries()) {
        if (filterFn(conversion, propertyKey)) {
            filteredConversionFunctions.set(propertyKey, conversion);
        }
    }

    return filteredConversionFunctions;
}
