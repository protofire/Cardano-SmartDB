import { BaseEntity } from '../../Entities/Base/Base.Entity.js';
import { console_error, console_log } from '../../Commons/BackEnd/globalLogs.js';
import { isEmptyObject, showData } from '../../Commons/utils.js';
import { OptionsGet } from '../../Commons/types.js';
import { connectPostgres, databasePostgreSQL } from '../../Commons/BackEnd/dbPostgreSQL.js';
import { Repository } from 'typeorm';
import { log } from 'console';
import { id } from 'date-fns/locale';
import { SiteSettingsEntity, SiteSettingsEntityPostgreSQL } from '../../backEnd.js';
// import { } from 'typeorm';

export class PostgreSQLDatabaseService {
    public static async create<T extends BaseEntity>(instance: T): Promise<string> {
        try {
            await connectPostgres();
            //const PostgreSQLModel = instance.getPostgreSQL()
            const postgreSQLInterface = await instance.getPostgreSQL().toPostgreSQLInterface(instance);

            const document = await databasePostgreSQL!.manager.save(postgreSQLInterface);
            if (document) {
                return document._id.toString();
            } else {
                throw `document is null`;
            }
        } catch (error) {
            console_error(0, `PostgreSQL`, `create - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async update<T extends BaseEntity>(instance: T, updateSet: {}, updateUnSet: {}) {
        try {
            await connectPostgres();

            const postgreSQLEntity = await instance.getPostgreSQL().toPostgreSQLInterface(instance);

            const sqlModel = await instance.getPostgreSQL().PostgreSQLModel();
            const repository = databasePostgreSQL!.manager.getRepository(sqlModel);

            // Aquí usamos el ID del objeto `instance` para identificar el registro a actualizar
            //
            const id = postgreSQLEntity._id;
            if (!id) {
                throw new Error('Instance does not have an id');
            }

            // Realizamos la actualización en PostgreSQL
            const document = await repository.update(
                { _id: id },
                {
                    ...updateSet,
                    ...updateUnSet,
                }
            );

            return document;
        } catch (error) {
            console_error(0, `PostgreSQL`, `update - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async delete<T extends BaseEntity>(instance: T): Promise<string> {
        try {
            await connectPostgres();

            const postgreSQLEntity = await instance.getPostgreSQL().toPostgreSQLInterface(instance);

            const sqlModel = await instance.getPostgreSQL().PostgreSQLModel();
            const repository = databasePostgreSQL!.manager.getRepository(sqlModel);

            const id = postgreSQLEntity._id;
            if (!id) {
                throw new Error('Instance does not have an id');
            }

            // Eliminamos el registro identificado por el ID
            await repository.delete(id);

            return `Entity with id ${id} deleted successfully`;
        } catch (error) {
            console_error(0, `PostgreSQL`, `delete - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async deleteByParams<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>): Promise<number | undefined> {
        try {
            await connectPostgres();

            const sqlModel = await Entity.getPostgreSQL().PostgreSQLModel();
            const repository = databasePostgreSQL!.manager.getRepository(sqlModel);

            // Eliminamos los registros que coincidan con los parámetros
            const result = await repository.delete(paramsFilter);

            return result.raw;
        } catch (error) {
            console_error(0, `PostgreSQL`, `deleteByParams - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async checkIfExists<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilterOrID: Record<string, any> | string): Promise<boolean> {
        try {
            await connectPostgres();

            const sqlModel = await Entity.getPostgreSQL().PostgreSQLModel();
            const repository = databasePostgreSQL!.manager.getRepository(sqlModel);

            let result;
            if (typeof paramsFilterOrID === 'string') {
                result = await repository.findOne({ where: { _id: paramsFilterOrID } });
            } else {
                result = await repository.findOne({ where: paramsFilterOrID });
            }

            return !!result; // Retorna `true` si existe el registro
        } catch (error) {
            console_error(0, `PostgreSQL`, `checkIfExists - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getByParams<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        paramsFilter: Record<string, any>,
        fieldsForSelect: Record<string, number>,
        useOptionGet: OptionsGet
    ) {
        try {
            await connectPostgres();

            const postgreSQLEntity = await Entity.getPostgreSQL().PostgreSQLModel();
            const repository = databasePostgreSQL!.manager.getRepository(postgreSQLEntity);

            const elems = await repository.findBy(paramsFilter);

            if (elems) {
                for (const elem of elems) {
                    console.log(showData(elem), false);
                }
                return elems;
            } else {
                throw `document is null`;
            }
        } catch (error) {
            console_error(0, `PostgreSQL`, `getByParams - Error: ${error}`);
            throw `${error}`;
        }
        //----------------------------
        //----------------------------
        // return query;
    }

    public static async getCount<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>): Promise<number> {
        await connectPostgres();

        const postgreSQLEntity = await Entity.getPostgreSQL().PostgreSQLModel();
        const repository = databasePostgreSQL!.manager.getRepository(postgreSQLEntity);

        const count = await repository.countBy(paramsFilter);

        return count;
    }

    // public static async aggregate<T extends BaseEntity>(Entity: typeof BaseEntity, pipeline: Record<string, any>[]) {
    //     await connectPostgres();
    //     //----------------------------
    //     const postgreSQLEntity = await Entity.getPostgreSQL().PostgreSQLModel();
    //     const repository = databasePostgreSQL!.manager.getRepository(postgreSQLEntity);
    //     //----------------------------
    //     let query;
    //     //----------------------------
    //     query = postgreSQLEntity.aggregate(pipeline);
    //     //----------------------------
    //     const documents = await query.exec();
    //     //----------------------------
    //     return documents;
    // }

    // public static getPostgreSQLTableName(baseName: string): string {
    //     baseName = baseName.toLowerCase();

    //     // Check if the class name ends with 'y' (but not 'ay', 'ey', 'iy', 'oy', 'uy' which typically just add 's')
    //     if (baseName.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(baseName.charAt(baseName.length - 2))) {
    //         // Replace 'y' with 'ies'
    //         return baseName.substring(0, baseName.length - 1) + 'ies';
    //     } else if (!baseName.endsWith('s')) {
    //         // If it does not end with 's', simply add 's'
    //         return baseName + 's';
    //     }
    //     // If it ends with 's', return as is (assuming it's already plural)
    //     return baseName;
    // }

    //     public static async getByParams<T extends BaseEntity>(
    //   Entity: typeof BaseEntity,
    //   paramsFilter: Record<string, any>,
    //   fieldsForSelectForPostgreSQL: Record<string, number>,
    //   useOptionGet: OptionsGet
    // ) {
    //   // console.log (`getByParams pre connect ${Entity.className()}`)
    //   await connectPostgres();
    //
    // }
    //     // console.log (`getByParams post connect ${Entity.className()}`)
    //     const PostgreSQLModel = Entity.getPostgreSQL().PostgreSQLModel();
    //     //----------------------------
    //     let query;
    //     //----------------------------
    //     let includesBiginFilter = false;
    //     let includesBiginSort = false;
    //     //----------------------------
    //     let filterFields: string[] = [];
    //     let sortFields: string[] = [];
    //     //----------------------------
    //     let bigintFields: string[] = [];
    //     //----------------------------
    //     let convertedFieldNames: Record<string, string> = {};
    //     //----------------------------
    //     // List of fields that are actually Bigints but stored as strings
    //     //----------------------------
    //     const conversionFunctions = getCombinedConversionFunctions(Entity.getStatic());
    //     if (conversionFunctions) {
    //         for (const [propertyKey, conversions] of conversionFunctions.entries()) {
    //             if (conversions.type === BigInt) {
    //                 bigintFields.push(propertyKey);
    //                 convertedFieldNames[propertyKey] = propertyKey + '_converted'; // New field name
    //             }
    //         }
    //     }
    //     //----------------------------
    //     if (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0) {
    //         useOptionGet.lookUpFields.forEach((lookupField) => {
    //             if (lookupField.foreignField === '_id' || lookupField.foreignField.endsWith('_id')) {
    //                 convertedFieldNames[lookupField.localField] = lookupField.localField + '_converted'; // New field name
    //             }
    //         });
    //     }
    //     //----------------------------
    //     // Function to recursively collect fields that require conversion
    //     function collectFieldsForConversion(query: Record<string, any>, collectedFields = new Set<string>()): string[] {
    //         Object.entries(query).forEach(([key, value]) => {
    //             if (['$or', '$and', '$not', '$nor'].includes(key) && Array.isArray(value)) {
    //                 // If the key is a query operator and its value is an array, recurse into each element
    //                 value.forEach((subQuery) => collectFieldsForConversion(subQuery, collectedFields));
    //             } else if (bigintFields.includes(key)) {
    //                 // If the key is one of the fields requiring conversion, add it to the set
    //                 collectedFields.add(key);
    //             } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    //                 // If the value is a nested object (subquery), recurse into it
    //                 collectFieldsForConversion(value, collectedFields);
    //             }
    //             // Other types of values (e.g., direct comparisons) do not need recursion
    //         });

    //         return Array.from(collectedFields); // Convert Set to Array before returning
    //     }
    //     //----------------------------
    //     function replaceFieldNamesInFilter(query: Record<string, any>, convertedFieldNames: Record<string, string>): Record<string, any> {
    //         const updatedQuery: Record<string, any> = {};
    //         for (const [key, value] of Object.entries(query)) {
    //             if (['$or', '$and', '$not', '$nor'].includes(key) && Array.isArray(value)) {
    //                 // Recursively handle array of conditions
    //                 updatedQuery[key] = value.map((subQuery) => replaceFieldNamesInFilter(subQuery, convertedFieldNames));
    //             } else if (bigintFields.includes(key)) {
    //                 // Replace field name if it's in the list of fields that need conversion
    //                 const newKey = convertedFieldNames[key];
    //                 updatedQuery[newKey] = value;
    //             } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.entries(value) !== undefined && Object.entries(value).length > 0) {
    //                 // Recursively handle nested objects
    //                 updatedQuery[key] = replaceFieldNamesInFilter(value, convertedFieldNames);
    //             } else {
    //                 // Copy over as-is if no replacement needed
    //                 updatedQuery[key] = value;
    //             }
    //         }

    //         return updatedQuery;
    //     }
    //     //----------------------------
    //     if (!isEmptyObject(paramsFilter)) {
    //         //----------------------------
    //         this.convertStringToRegexAndObjectId(Entity, paramsFilter);
    //         filterFields = collectFieldsForConversion(paramsFilter);
    //         includesBiginFilter = filterFields.some((field) => bigintFields.includes(field));
    //     }
    //     //----------------------------
    //     if (!isEmptyObject(useOptionGet.sort)) {
    //         //----------------------------
    //         // Check if sort criteria include any Bigint fields
    //         sortFields = Object.keys(useOptionGet!.sort!);
    //         includesBiginSort = sortFields.some((field) => bigintFields.includes(field));
    //         //----------------------------
    //     }
    //     //----------------------------
    //     if (includesBiginFilter || includesBiginSort || (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0)) {
    //         // Build an aggregation pipeline
    //         let pipeline = [];
    //         //----------------------------
    //         if (paramsFilter._id && typeof paramsFilter._id === 'string') {
    //             paramsFilter._id = new Types.ObjectId(paramsFilter._id);
    //         }
    //         //----------------------------
    //         // Convert Bigint fields to numbers for filter and sorting
    //         let addFieldsStage = {
    //             $addFields: {},
    //         };
    //         //----------------------------
    //         const divisor = 1_000_000_000;
    //         //----------------------------
    //         filterFields.forEach((field) => {
    //             if (bigintFields.includes(field)) {
    //                 let defaultValue = 0;
    //                 (addFieldsStage.$addFields as any)[convertedFieldNames[field]] = {
    //                     $convert: {
    //                         // input: `$${field}`
    //                         input: { $divide: [{ $toDecimal: `$${field}` }, divisor] },
    //                         to: 'decimal',
    //                         onError: defaultValue,
    //                         onNull: defaultValue,
    //                         // onError: 'Error', // Handle conversion error
    //                         // onNull: 'Error', // Handle null values
    //                     },
    //                 };
    //             }
    //         });
    //         //----------------------------
    //         sortFields.forEach((field) => {
    //             if (bigintFields.includes(field)) {
    //                 let sortOrder = useOptionGet.sort![field]; // Get the sort order for the field
    //                 let defaultValueForSort = sortOrder === -1 ? -Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    //                 (addFieldsStage.$addFields as any)[convertedFieldNames[field]] = {
    //                     $convert: {
    //                         input: `$${field}`,
    //                         //input: { $toDecimal: `$${field}` },
    //                         // input: { $divide: [{ $toDecimal: `$${field}` }, divisor] },
    //                         to: 'decimal',
    //                         onError: defaultValueForSort, // Use a large number for sorting to the end
    //                         onNull: defaultValueForSort, // Use a large number for sorting to the end
    //                         // onError: 'Error', // Handle conversion error
    //                         // onNull: 'Error', // Handle null values
    //                     },
    //                 };
    //             }
    //         });
    //         //----------------------------
    //         if (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0) {
    //             useOptionGet.lookUpFields.forEach((lookupField) => {
    //                 if (lookupField.foreignField === '_id' || lookupField.foreignField.endsWith('_id')) {
    //                     (addFieldsStage.$addFields as any)[convertedFieldNames[lookupField.localField]] = {
    //                         $convert: {
    //                             input: `$${lookupField.localField}`,
    //                             to: 'objectId',
    //                             // onError: 'Error', // Handle conversion error
    //                             // onNull: 'Error', // Handle null values
    //                         },
    //                     };
    //                 }
    //             });
    //         }
    //         //----------------------------
    //         if (Object.keys(addFieldsStage.$addFields).length > 0) {
    //             pipeline.push(addFieldsStage);

    //             if (!isEmptyObject(fieldsForSelectForPostgreSQL)) {
    //                 // esto es solo para testing...
    //                 // me aseguro que no sea empty, si no estaria agregando fields a la proyection con 1, y solo lenvatnaria los convertidos, en lugar de levantar todos como cuando es empty
    //                 if (Object.values(fieldsForSelectForPostgreSQL).every((value) => value === 1)) {
    //                     // si es una lista de inclusion me encargo de agregar los elementso que van always
    //                     const additionalFieldsForProjection = Object.keys(addFieldsStage.$addFields).reduce((acc: Record<string, number>, field) => {
    //                         acc[field] = 1;
    //                         return acc;
    //                     }, {});
    //                     // Merge this object with fieldsForSelectForPostgreSQL
    //                     fieldsForSelectForPostgreSQL = { ...fieldsForSelectForPostgreSQL, ...additionalFieldsForProjection };
    //                 }
    //             }
    //         }
    //         //----------------------------
    //         // Add $lookup stages to the pipeline based on lookUpFields
    //         if (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0) {
    //             useOptionGet.lookUpFields.forEach((lookupField) => {
    //                 const fieldsForSelect = lookupField.fieldsForSelect;
    //                 let pipeline_: { $project: Record<string, number> }[] = [];
    //                 if (fieldsForSelect !== undefined && !isEmptyObject(fieldsForSelect)) {
    //                     const fieldsForSelectForPostgreSQL_ = Object.fromEntries(Object.keys(fieldsForSelect).map((key) => [key, fieldsForSelect[key] ? 1 : 0]));
    //                     pipeline_ = [{ $project: fieldsForSelectForPostgreSQL_ }];
    //                 }
    //                 if (lookupField.foreignField === '_id' || lookupField.foreignField.endsWith('_id')) {
    //                     let lookup: Record<string, any> = {
    //                         from: this.getPostgreSQLTableName(lookupField.from),
    //                         localField: convertedFieldNames[lookupField.localField],
    //                         foreignField: lookupField.foreignField,
    //                         as: lookupField.as,
    //                     };
    //                     if (pipeline_.length > 0) {
    //                         lookup = { ...lookup, pipeline: pipeline_ };
    //                     }
    //                     pipeline.push({
    //                         $lookup: lookup,
    //                     });
    //                 } else {
    //                     let lookup: Record<string, any> = {
    //                         from: this.getPostgreSQLTableName(lookupField.from),
    //                         localField: lookupField.localField,
    //                         foreignField: lookupField.foreignField,
    //                         as: lookupField.as,
    //                     };
    //                     if (pipeline_.length > 0) {
    //                         lookup = { ...lookup, pipeline: pipeline_ };
    //                     }
    //                     pipeline.push({
    //                         $lookup: lookup,
    //                     });
    //                 }
    //             });
    //             // Optional: If you're sure each $lookup will always return a single document and want to flatten the results
    //             // You can add a $unwind stage for each lookup result.
    //             useOptionGet.lookUpFields.forEach((lookupField) => {
    //                 // Add $unwind stage only if necessary. Comment out or remove if not needed.
    //                 pipeline.push({
    //                     $unwind: {
    //                         path: `$${lookupField.as}`,
    //                         // Include the path in the output documents even if the path is null, empty, or missing.
    //                         preserveNullAndEmptyArrays: true,
    //                     },
    //                 });
    //             });
    //         }
    //         //----------------------------
    //         if (!isEmptyObject(paramsFilter)) {
    //             // Apply filters
    //             const newFilter = replaceFieldNamesInFilter(paramsFilter, convertedFieldNames);
    //             pipeline.push({ $match: newFilter });
    //         }
    //         //----------------------------
    //         if (!isEmptyObject(useOptionGet.sort)) {
    //             // Apply sorting
    //             let sortStage = { $sort: {} };
    //             for (let field of sortFields) {
    //                 let sortField = bigintFields.includes(field) ? convertedFieldNames[field] : field;
    //                 (sortStage.$sort as any)[sortField] = useOptionGet!.sort![field];
    //             }
    //             pipeline.push(sortStage);
    //         }
    //         //----------------------------
    //         // Apply skip if necessary
    //         if (useOptionGet.skip !== undefined) {
    //             pipeline.push({ $skip: useOptionGet.skip });
    //         }
    //         // Apply limit if necessary
    //         if (useOptionGet.limit !== undefined) {
    //             pipeline.push({ $limit: useOptionGet.limit });
    //         }
    //         //----------------------------
    //         // Apply projection
    //         if (!isEmptyObject(fieldsForSelectForPostgreSQL)) {
    //             pipeline.push({ $project: fieldsForSelectForPostgreSQL });
    //         }
    //         //----------------------------
    //         console_log(0, `PostgreSQL`, `getByParams - pipeline: ${toJson(pipeline)}`);
    //         //----------------------------
    //         query = PostgreSQLModel.aggregate(pipeline);
    //         //----------------------------
    //         const documents = await query.exec();
    //         //----------------------------
    //         console_log(
    //             0,
    //             `PostgreSQL`,
    //             `getByParam - pipeline - found ${documents.length} document(s)... - show: ${documents
    //                 .map((item: any) =>
    //                     toJson({
    //                         _id: item._id,
    //                         name: item.name ?? '',
    //                         fieldsConverted: Object.keys(addFieldsStage.$addFields).map((field) => {
    //                             return { field, value: item[field] };
    //                         }),
    //                     })
    //                 )
    //                 .join('      |     ')}`
    //         );
    //         //--------------------------
    //         return documents;
    //     } else {
    //         //----------------------------
    //         // Normal find query
    //         query = PostgreSQLModel.find(paramsFilter, fieldsForSelectForPostgreSQL);
    //         //----------------------------
    //         if (useOptionGet.skip !== undefined) {
    //             query = query.skip(useOptionGet.skip);
    //         }
    //         if (useOptionGet.limit !== undefined) {
    //             query = query.limit(useOptionGet.limit);
    //         }
    //         //----------------------------
    //         if (!isEmptyObject(useOptionGet.sort)) {
    //             query = query.sort(useOptionGet.sort);
    //         }
    //         //----------------------------
    //         // console_log(0, `PostgreSQL`, `getByParams - query - paramsFilter: ${toJson(paramsFilter)} - fieldsForSelectForPostgreSQL: ${toJson(fieldsForSelectForPostgreSQL)} - useOptionGet: ${toJson(useOptionGet)}`);
    //         //----------------------------
    //         const documents = await query.exec();
    //         //----------------------------
    //         return documents;
    //     }
    // }

    // public static convertStringToRegexAndObjectId<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>) {
    //     try {
    //         //----------------------------
    //         const PostgreSQLModel = Entity.getPostgreSQL().PostgreSQLModel();
    //         //----------------------------
    //         for (const key in paramsFilter) {
    //             if (typeof paramsFilter[key] === 'string') {
    //                 // Convert string to RegExp if it starts with '/'
    //                 if (paramsFilter[key].startsWith('/')) {
    //                     const regExpParts = paramsFilter[key].split('/');
    //                     const pattern = regExpParts[1];
    //                     const flags = regExpParts[2];
    //                     paramsFilter[key] = new RegExp(pattern, flags);
    //                 }
    //                 // Convert string to ObjectId if the key ends with '_id'
    //                 else if (key === '_id' || (key.endsWith('_id') && PostgreSQLModel?.schema?.obj[key] !== undefined && PostgreSQLModel?.schema?.obj[key].type?.name === 'ObjectId')) {
    //                     try {
    //                         paramsFilter[key] = new Types.ObjectId(paramsFilter[key]);
    //                     } catch (error) {
    //                         console_error(0, `PostgreSQL`, `Error converting ${key} to ObjectId - Error: ${error}`);
    //                         throw `Error converting ${key} to ObjectId - Error: ${error}`;
    //                     }
    //                 }
    //             } else if (typeof paramsFilter[key] === 'object' && paramsFilter[key] !== null) {
    //                 if (key === '_id' || (key.endsWith('_id') && PostgreSQLModel?.schema?.obj[key] !== undefined && PostgreSQLModel?.schema?.obj[key].type?.name === 'ObjectId')) {
    //                     if (paramsFilter[key].$in) {
    //                         paramsFilter[key].$in = paramsFilter[key].$in.map((id: string) => {
    //                             try {
    //                                 return new Types.ObjectId(id);
    //                             } catch (error) {
    //                                 console_error(0, `PostgreSQL`, `Error converting ${id} to ObjectId in $in - Error: ${error}`);
    //                                 throw `Error: Error converting ${id} to ObjectId in $in - Error: ${error}`;
    //                             }
    //                         });
    //                     } else if (paramsFilter[key].$nin) {
    //                         paramsFilter[key].$nin = paramsFilter[key].$nin.map((id: string) => {
    //                             try {
    //                                 return new Types.ObjectId(id);
    //                             } catch (error) {
    //                                 console_error(0, `PostgreSQL`, `Error converting ${id} to ObjectId in $nin - Error: ${error}`);
    //                                 throw `Error: Error converting ${id} to ObjectId in $nin - Error: ${error}`;
    //                             }
    //                         });
    //                     } else if (paramsFilter[key].$eq) {
    //                         try {
    //                             paramsFilter[key].$eq = new Types.ObjectId(paramsFilter[key].$eq);
    //                         } catch (error) {
    //                             console_error(0, `PostgreSQL`, `Error converting ${paramsFilter[key].$eq} to ObjectId in $eq - Error: ${error}`);
    //                             throw `Error converting ${paramsFilter[key].$eq} to ObjectId in $eq - Error: ${error}`;
    //                         }
    //                     } else if (paramsFilter[key].$ne) {
    //                         try {
    //                             paramsFilter[key].$ne = new Types.ObjectId(paramsFilter[key].$ne);
    //                         } catch (error) {
    //                             console_error(0, `PostgreSQL`, `Error converting ${paramsFilter[key].$ne} to ObjectId in $ne - Error: ${error}`);
    //                             throw `Error converting ${paramsFilter[key].$ne} to ObjectId in $ne - Error: ${error}`;
    //                         }
    //                     } else {
    //                         console_error(
    //                             0,
    //                             `PostgreSQL`,
    //                             `Error converting ${paramsFilter[key].$ne} to ObjectId in $ne - Error: Error: ${key} is an ObjectId field, but the filter is not a valid filter for ObjectId fields`
    //                         );
    //                         throw `Error converting ${paramsFilter[key].$ne} to ObjectId in $ne - Error: ${key} is an ObjectId field, but the filter is not a valid filter for ObjectId fields`;
    //                     }
    //                 } else {
    //                     // Recursive call for nested objects (like those in $or or $and)
    //                     this.convertStringToRegexAndObjectId(Entity, paramsFilter[key]);
    //                 }
    //             }
    //         }
    //     } catch (error) {
    //         console_error(0, `PostgreSQL`, `convertStringToRegexAndObjectId - Error: ${error}`);
    //         throw `${error}`;
    //     }
    // }
}
