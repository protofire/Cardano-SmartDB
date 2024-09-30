import { BaseEntity } from '../../Entities/Base/Base.Entity.js';
import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { connectMongoDB } from '../../Commons/BackEnd/dbMongo.js';
import { console_error, console_log } from '../../Commons/BackEnd/globalLogs.js';
import { getMongoTableName, isEmptyObject, isString, toJson } from '../../Commons/utils.js';
import { OptionsGet } from '../../Commons/types.js';
import { getCombinedConversionFunctions } from '../../Commons/Decorators/Decorator.Convertible.js';

export class MongoDatabaseService {
    public static async create<T extends BaseEntity>(instance: T): Promise<string> {
        try {
            await connectMongoDB();
            const MongoModel = instance.getMongo().MongoModel();
            const mongoInterface = await instance.getMongo().toMongoInterface(instance);
            const Mongo = new MongoModel(mongoInterface);
            const document = await Mongo.save();
            if (document) {
                return document._id.toString();
            } else {
                throw `document is null`;
            }
        } catch (error) {
            console_error(0, `Mongo`, `create - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async update<T extends BaseEntity>(instance: T, updateSet: Record<string, any>, updateUnSet: Record<string, any>) {
        try {
            await connectMongoDB();
            const MongoModel = instance.getMongo().MongoModel();
            let instanceId: Types.ObjectId | undefined = undefined;
            try {
                instanceId = new Types.ObjectId(instance._DB_id);
                if (instanceId === undefined) throw `id is undefined`;
            } catch (error) {
                console_error(0, `Mongo`, `Error converting ${instanceId} to ObjectId - Error: ${error}`);
                throw `Error: Error converting ${instanceId} to ObjectId - Error: ${error}`;
            }
            const document = await MongoModel.findOneAndUpdate({ _id: instanceId }, { $set: updateSet, $unset: updateUnSet }, { new: true });
            return document;
        } catch (error) {
            console_error(0, `Mongo`, `update - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async deleteByParams<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>): Promise<number | undefined> {
        try {
            await connectMongoDB();
            const MongoModel = Entity.getMongo().MongoModel();
            this.convertStringToRegexAndObjectId(Entity, paramsFilter);
            const result = await MongoModel.deleteMany(paramsFilter);
            return result?.deletedCount;
        } catch (error) {
            console_error(0, `Mongo`, `deleteByParams - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async delete<T extends BaseEntity>(instance: T) {
        try {
            await connectMongoDB();
            const MongoModel = instance.getMongo().MongoModel();
            let instanceId: Types.ObjectId | undefined = undefined;
            try {
                instanceId = new Types.ObjectId(instance._DB_id);
                if (instanceId === undefined) throw `id is undefined`;
            } catch (error) {
                console_error(0, `Mongo`, `Error converting ${instanceId} to ObjectId - Error: ${error}`);
                throw `Error: Error converting ${instanceId} to ObjectId - Error: ${error}`;
            }
            const document = await MongoModel.findByIdAndDelete(instanceId).exec();
            return document;
        } catch (error) {
            console_error(0, `Mongo`, `delete - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async checkIfExists<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilterOrID: Record<string, any> | string): Promise<boolean> {
        try {
            await connectMongoDB();
            const MongoModel = Entity.getMongo().MongoModel();
            let document;
            //----------------------------
            if (isString(paramsFilterOrID)) {
                let instanceId: Types.ObjectId | undefined = undefined;
                try {
                    instanceId = new Types.ObjectId(paramsFilterOrID);
                    if (instanceId === undefined) throw `id is undefined`;
                } catch (error) {
                    console_error(0, `Mongo`, `Error converting ${instanceId} to ObjectId - Error: ${error}`);
                    throw `Error: Error converting ${instanceId} to ObjectId - Error: ${error}`;
                }
                document = await MongoModel.findById(instanceId, { _id: 1 }).exec();
            } else {
                this.convertStringToRegexAndObjectId(Entity, paramsFilterOrID);
                document = await MongoModel.findOne(paramsFilterOrID, { _id: 1 }).exec();
            }
            //----------------------------
            if (document) {
                //console_log(0, `Mongo`, `checkIfExists - True`);
                return true;
            } else {
                console_log(0, `Mongo`, `checkIfExists - False`);
                return false;
            }
        } catch (error) {
            console_error(0, `Mongo`, `checkIfExists - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getByParams<T extends BaseEntity>(
        Entity: typeof BaseEntity,
        paramsFilter: Record<string, any>,
        fieldsForSelectForMongo: Record<string, number>,
        useOptionGet: OptionsGet
    ) {
        // console.log (`getByParams pre connect ${Entity.className()}`)
        await connectMongoDB();
        // console.log (`getByParams post connect ${Entity.className()}`)
        const MongoModel = Entity.getMongo().MongoModel();
        //----------------------------
        let query;
        //----------------------------
        let includesBiginFilter = false;
        let includesBiginSort = false;
        //----------------------------
        let filterFields: string[] = [];
        let sortFields: string[] = [];
        //----------------------------
        let bigintFields: string[] = [];
        //----------------------------
        let convertedFieldNames: Record<string, string> = {};
        //----------------------------
        // List of fields that are actually Bigints but stored as strings
        //----------------------------
        const conversionFunctions = getCombinedConversionFunctions(Entity.getStatic());
        if (conversionFunctions) {
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                if (conversions.type === BigInt) {
                    bigintFields.push(propertyKey);
                    convertedFieldNames[propertyKey] = propertyKey + '_converted'; // New field name
                }
            }
        }
        //----------------------------
        if (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0) {
            useOptionGet.lookUpFields.forEach((lookupField) => {
                if (lookupField.foreignField === '_id' || lookupField.foreignField.endsWith('_id')) {
                    convertedFieldNames[lookupField.localField] = lookupField.localField + '_converted'; // New field name
                }
            });
        }
        //----------------------------
        // Function to recursively collect fields that require conversion
        function collectFieldsForConversion(query: Record<string, any>, collectedFields = new Set<string>()): string[] {
            Object.entries(query).forEach(([key, value]) => {
                if (['$or', '$and', '$not', '$nor'].includes(key) && Array.isArray(value)) {
                    // If the key is a query operator and its value is an array, recurse into each element
                    value.forEach((subQuery) => collectFieldsForConversion(subQuery, collectedFields));
                } else if (bigintFields.includes(key)) {
                    // If the key is one of the fields requiring conversion, add it to the set
                    collectedFields.add(key);
                } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // If the value is a nested object (subquery), recurse into it
                    collectFieldsForConversion(value, collectedFields);
                }
                // Other types of values (e.g., direct comparisons) do not need recursion
            });

            return Array.from(collectedFields); // Convert Set to Array before returning
        }
        //----------------------------
        function replaceFieldNamesInFilter(query: Record<string, any>, convertedFieldNames: Record<string, string>): Record<string, any> {
            const updatedQuery: Record<string, any> = {};
            for (const [key, value] of Object.entries(query)) {
                if (['$or', '$and', '$not', '$nor'].includes(key) && Array.isArray(value)) {
                    // Recursively handle array of conditions
                    updatedQuery[key] = value.map((subQuery) => replaceFieldNamesInFilter(subQuery, convertedFieldNames));
                } else if (bigintFields.includes(key)) {
                    // Replace field name if it's in the list of fields that need conversion
                    const newKey = convertedFieldNames[key];
                    updatedQuery[newKey] = value;
                } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.entries(value) !== undefined && Object.entries(value).length > 0) {
                    // Recursively handle nested objects
                    updatedQuery[key] = replaceFieldNamesInFilter(value, convertedFieldNames);
                } else {
                    // Copy over as-is if no replacement needed
                    updatedQuery[key] = value;
                }
            }

            return updatedQuery;
        }
        //----------------------------
        if (!isEmptyObject(paramsFilter)) {
            //----------------------------
            this.convertStringToRegexAndObjectId(Entity, paramsFilter);
            filterFields = collectFieldsForConversion(paramsFilter);
            includesBiginFilter = filterFields.some((field) => bigintFields.includes(field));
        }
        //----------------------------
        if (!isEmptyObject(useOptionGet.sort)) {
            //----------------------------
            // Check if sort criteria include any Bigint fields
            sortFields = Object.keys(useOptionGet!.sort!);
            includesBiginSort = sortFields.some((field) => bigintFields.includes(field));
            //----------------------------
        }
        //----------------------------
        if (includesBiginFilter || includesBiginSort || (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0)) {
            // Build an aggregation pipeline
            let pipeline = [];
            //----------------------------
            if (paramsFilter._id && typeof paramsFilter._id === 'string') {
                paramsFilter._id = new Types.ObjectId(paramsFilter._id);
            }
            //----------------------------
            // Convert Bigint fields to numbers for filter and sorting
            let addFieldsStage = {
                $addFields: {},
            };
            //----------------------------
            const divisor = 1_000_000_000;
            //----------------------------
            filterFields.forEach((field) => {
                if (bigintFields.includes(field)) {
                    let defaultValue = 0;
                    (addFieldsStage.$addFields as any)[convertedFieldNames[field]] = {
                        $convert: {
                            // input: `$${field}`
                            input: { $divide: [{ $toDecimal: `$${field}` }, divisor] },
                            to: 'decimal',
                            onError: defaultValue,
                            onNull: defaultValue,
                            // onError: 'Error', // Handle conversion error
                            // onNull: 'Error', // Handle null values
                        },
                    };
                }
            });
            //----------------------------
            sortFields.forEach((field) => {
                if (bigintFields.includes(field)) {
                    let sortOrder = useOptionGet.sort![field]; // Get the sort order for the field
                    let defaultValueForSort = sortOrder === -1 ? -Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
                    (addFieldsStage.$addFields as any)[convertedFieldNames[field]] = {
                        $convert: {
                            input: `$${field}`,
                            //input: { $toDecimal: `$${field}` },
                            // input: { $divide: [{ $toDecimal: `$${field}` }, divisor] },
                            to: 'decimal',
                            onError: defaultValueForSort, // Use a large number for sorting to the end
                            onNull: defaultValueForSort, // Use a large number for sorting to the end
                            // onError: 'Error', // Handle conversion error
                            // onNull: 'Error', // Handle null values
                        },
                    };
                }
            });
            //----------------------------
            if (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0) {
                useOptionGet.lookUpFields.forEach((lookupField) => {
                    if (lookupField.foreignField === '_id' || lookupField.foreignField.endsWith('_id')) {
                        (addFieldsStage.$addFields as any)[convertedFieldNames[lookupField.localField]] = {
                            $convert: {
                                input: `$${lookupField.localField}`,
                                to: 'objectId',
                                // onError: 'Error', // Handle conversion error
                                // onNull: 'Error', // Handle null values
                            },
                        };
                    }
                });
            }
            //----------------------------
            if (Object.keys(addFieldsStage.$addFields).length > 0) {
                pipeline.push(addFieldsStage);

                if (!isEmptyObject(fieldsForSelectForMongo)) {
                    // esto es solo para testing...
                    // me aseguro que no sea empty, si no estaria agregando fields a la proyection con 1, y solo lenvatnaria los convertidos, en lugar de levantar todos como cuando es empty
                    if (Object.values(fieldsForSelectForMongo).every((value) => value === 1)) {
                        // si es una lista de inclusion me encargo de agregar los elementso que van always
                        const additionalFieldsForProjection = Object.keys(addFieldsStage.$addFields).reduce((acc: Record<string, number>, field) => {
                            acc[field] = 1;
                            return acc;
                        }, {});
                        // Merge this object with fieldsForSelectForMongo
                        fieldsForSelectForMongo = { ...fieldsForSelectForMongo, ...additionalFieldsForProjection };
                    }
                }
            }
            //----------------------------
            // Add $lookup stages to the pipeline based on lookUpFields
            if (useOptionGet.lookUpFields !== undefined && useOptionGet.lookUpFields.length > 0) {
                useOptionGet.lookUpFields.forEach((lookupField) => {
                    const fieldsForSelect = lookupField.fieldsForSelect;
                    let pipeline_: { $project: Record<string, number> }[] = [];
                    if (fieldsForSelect !== undefined && !isEmptyObject(fieldsForSelect)) {
                        const fieldsForSelectForMongo_ = Object.fromEntries(Object.keys(fieldsForSelect).map((key) => [key, fieldsForSelect[key] ? 1 : 0]));
                        pipeline_ = [{ $project: fieldsForSelectForMongo_ }];
                    }
                    if (lookupField.foreignField === '_id' || lookupField.foreignField.endsWith('_id')) {
                        let lookup: Record<string, any> = {
                            from: getMongoTableName(lookupField.from),
                            localField: convertedFieldNames[lookupField.localField],
                            foreignField: lookupField.foreignField,
                            as: lookupField.as,
                        };
                        if (pipeline_.length > 0) {
                            lookup = { ...lookup, pipeline: pipeline_ };
                        }
                        pipeline.push({
                            $lookup: lookup,
                        });
                    } else {
                        let lookup: Record<string, any> = {
                            from: getMongoTableName(lookupField.from),
                            localField: lookupField.localField,
                            foreignField: lookupField.foreignField,
                            as: lookupField.as,
                        };
                        if (pipeline_.length > 0) {
                            lookup = { ...lookup, pipeline: pipeline_ };
                        }
                        pipeline.push({
                            $lookup: lookup,
                        });
                    }
                });
                // Optional: If you're sure each $lookup will always return a single document and want to flatten the results
                // You can add a $unwind stage for each lookup result.
                useOptionGet.lookUpFields.forEach((lookupField) => {
                    // Add $unwind stage only if necessary. Comment out or remove if not needed.
                    pipeline.push({
                        $unwind: {
                            path: `$${lookupField.as}`,
                            // Include the path in the output documents even if the path is null, empty, or missing.
                            preserveNullAndEmptyArrays: true,
                        },
                    });
                });
            }
            //----------------------------
            if (!isEmptyObject(paramsFilter)) {
                // Apply filters
                const newFilter = replaceFieldNamesInFilter(paramsFilter, convertedFieldNames);
                pipeline.push({ $match: newFilter });
            }
            //----------------------------
            if (!isEmptyObject(useOptionGet.sort)) {
                // Apply sorting
                let sortStage = { $sort: {} };
                for (let field of sortFields) {
                    let sortField = bigintFields.includes(field) ? convertedFieldNames[field] : field;
                    (sortStage.$sort as any)[sortField] = useOptionGet!.sort![field];
                }
                pipeline.push(sortStage);
            }
            //----------------------------
            // Apply skip if necessary
            if (useOptionGet.skip !== undefined) {
                pipeline.push({ $skip: useOptionGet.skip });
            }
            // Apply limit if necessary
            if (useOptionGet.limit !== undefined) {
                pipeline.push({ $limit: useOptionGet.limit });
            }
            //----------------------------
            // Apply projection
            if (!isEmptyObject(fieldsForSelectForMongo)) {
                pipeline.push({ $project: fieldsForSelectForMongo });
            }
            //----------------------------
            console_log(0, `Mongo`, `getByParams - pipeline: ${toJson(pipeline)}`);
            //----------------------------
            query = MongoModel.aggregate(pipeline);
            //----------------------------
            const documents = await query.exec();
            //----------------------------
            console_log(
                0,
                `Mongo`,
                `getByParam - pipeline - found ${documents.length} document(s)... - show: ${documents
                    .map((item: any) =>
                        toJson({
                            _id: item._id,
                            name: item.name ?? '',
                            fieldsConverted: Object.keys(addFieldsStage.$addFields).map((field) => {
                                return { field, value: item[field] };
                            }),
                        })
                    )
                    .join('      |     ')}`
            );
            //--------------------------
            return documents;
        } else {
            //----------------------------
            // Normal find query
            query = MongoModel.find(paramsFilter, fieldsForSelectForMongo);
            //----------------------------
            if (useOptionGet.skip !== undefined) {
                query = query.skip(useOptionGet.skip);
            }
            if (useOptionGet.limit !== undefined) {
                query = query.limit(useOptionGet.limit);
            }
            //----------------------------
            if (!isEmptyObject(useOptionGet.sort)) {
                query = query.sort(useOptionGet.sort);
            }
            //----------------------------
            // console_log(0, `Mongo`, `getByParams - query - paramsFilter: ${toJson(paramsFilter)} - fieldsForSelectForMongo: ${toJson(fieldsForSelectForMongo)} - useOptionGet: ${toJson(useOptionGet)}`);
            //----------------------------
            const documents = await query.exec();
            //----------------------------
            return documents;
        }
    }

    public static async getCount<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>): Promise<number> {
        await connectMongoDB();
        const MongoModel = Entity.getMongo().MongoModel();
        this.convertStringToRegexAndObjectId(Entity, paramsFilter);
        const count = await MongoModel.countDocuments(paramsFilter).exec();
        return count;
    }

    public static async aggregate<T extends BaseEntity>(Entity: typeof BaseEntity, pipeline: Record<string, any>[]) {
        await connectMongoDB();
        //----------------------------
        const MongoModel = Entity.getMongo().MongoModel();
        //----------------------------
        let query;
        //----------------------------
        query = MongoModel.aggregate(pipeline);
        //----------------------------
        const documents = await query.exec();
        //----------------------------
        return documents;
    }

    public static convertStringToRegexAndObjectId<T extends BaseEntity>(Entity: typeof BaseEntity, paramsFilter: Record<string, any>) {
        try {
            //----------------------------
            const MongoModel = Entity.getMongo().MongoModel();
            //----------------------------
            for (const key in paramsFilter) {
                if (typeof paramsFilter[key] === 'string') {
                    // Convert string to RegExp if it starts with '/'
                    if (paramsFilter[key].startsWith('/')) {
                        const regExpParts = paramsFilter[key].split('/');
                        const pattern = regExpParts[1];
                        const flags = regExpParts[2];
                        paramsFilter[key] = new RegExp(pattern, flags);
                    }
                    // Convert string to ObjectId if the key ends with '_id'
                    else if (key === '_id' || (key.endsWith('_id') && MongoModel?.schema?.obj[key] !== undefined && MongoModel?.schema?.obj[key].type?.name === 'ObjectId')) {
                        try {
                            paramsFilter[key] = new Types.ObjectId(paramsFilter[key]);
                        } catch (error) {
                            console_error(0, `Mongo`, `Error converting ${key} to ObjectId - Error: ${error}`);
                            throw `Error converting ${key} to ObjectId - Error: ${error}`;
                        }
                    }
                } else if (typeof paramsFilter[key] === 'object' && paramsFilter[key] !== null) {
                    if (key === '_id' || (key.endsWith('_id') && MongoModel?.schema?.obj[key] !== undefined && MongoModel?.schema?.obj[key].type?.name === 'ObjectId')) {
                        if (paramsFilter[key].$in) {
                            paramsFilter[key].$in = paramsFilter[key].$in.map((id: string) => {
                                try {
                                    return new Types.ObjectId(id);
                                } catch (error) {
                                    console_error(0, `Mongo`, `Error converting ${id} to ObjectId in $in - Error: ${error}`);
                                    throw `Error: Error converting ${id} to ObjectId in $in - Error: ${error}`;
                                }
                            });
                        } else if (paramsFilter[key].$nin) {
                            paramsFilter[key].$nin = paramsFilter[key].$nin.map((id: string) => {
                                try {
                                    return new Types.ObjectId(id);
                                } catch (error) {
                                    console_error(0, `Mongo`, `Error converting ${id} to ObjectId in $nin - Error: ${error}`);
                                    throw `Error: Error converting ${id} to ObjectId in $nin - Error: ${error}`;
                                }
                            });
                        } else if (paramsFilter[key].$eq) {
                            try {
                                paramsFilter[key].$eq = new Types.ObjectId(paramsFilter[key].$eq);
                            } catch (error) {
                                console_error(0, `Mongo`, `Error converting ${paramsFilter[key].$eq} to ObjectId in $eq - Error: ${error}`);
                                throw `Error converting ${paramsFilter[key].$eq} to ObjectId in $eq - Error: ${error}`;
                            }
                        } else if (paramsFilter[key].$ne) {
                            try {
                                paramsFilter[key].$ne = new Types.ObjectId(paramsFilter[key].$ne);
                            } catch (error) {
                                console_error(0, `Mongo`, `Error converting ${paramsFilter[key].$ne} to ObjectId in $ne - Error: ${error}`);
                                throw `Error converting ${paramsFilter[key].$ne} to ObjectId in $ne - Error: ${error}`;
                            }
                        } else {
                            console_error(
                                0,
                                `Mongo`,
                                `Error converting ${paramsFilter[key].$ne} to ObjectId in $ne - Error: Error: ${key} is an ObjectId field, but the filter is not a valid filter for ObjectId fields`
                            );
                            throw `Error converting ${paramsFilter[key].$ne} to ObjectId in $ne - Error: ${key} is an ObjectId field, but the filter is not a valid filter for ObjectId fields`;
                        }
                    } else {
                        // Recursive call for nested objects (like those in $or or $and)
                        this.convertStringToRegexAndObjectId(Entity, paramsFilter[key]);
                    }
                }
            }
        } catch (error) {
            console_error(0, `Mongo`, `convertStringToRegexAndObjectId - Error: ${error}`);
            throw `${error}`;
        }
    }
}
