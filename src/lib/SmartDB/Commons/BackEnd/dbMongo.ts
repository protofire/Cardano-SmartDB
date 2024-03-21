import * as Mongoose from 'mongoose';
import EventEmitter from 'events';

export const dbEvents = new EventEmitter();
let database: Mongoose.Connection | null = null;

dbEvents.on('dbError', (err) => {
    console.error(`Database Error: ${err}`);
    throw new Error(`Database Error: ${err}`);
});

export const connectMongoDB = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        if (database !== null) {
            // Already connected
            // console.log(`Already connected to database`);
            resolve();
            return;
        }

        const uri = process.env.MONGO_URLDB;
        if (!uri) {
            reject('Please define the MONGO_URLDB environment variable');
            return;
        }

        const serverSelectionTimeoutMS = 10000; // 10 seconds

        const opts = {
            bufferCommands: true,
            useNewUrlParser: true,
            serverSelectionTimeoutMS: serverSelectionTimeoutMS,
            // ... other options
        };

        for (let i = 0; i < 3; ++i) {
            try {
                await Mongoose.connect(uri, opts);
                break;
            } catch (err) {
                console.log(`Error database connection (Try ${i + 1}): ${err}}`);
                if (i >= 2) {
                    reject(err);
                }
            }
        }

        database = Mongoose.connection;
        database.once('connected', () => {
            // Connected to database
            console.log(`Connected to database`);
        });
        database.on('error', (err) => {
            dbEvents.emit('dbError', err);
        });

        resolve();
    });
};

export const disconnect = async () => {
    if (!database) {
        return;
    }
    await Mongoose.disconnect();
};

export function convertParamsForAggregation(query: any, prefix: string): any {
    const excludedKeywords = ['$and', '$or', '$nor', '$not'];

    const convertedQuery: any = {};

    for (const key in query) {
        if (Object.prototype.hasOwnProperty.call(query, key)) {
            const value = query[key];

            if (excludedKeywords.includes(key)) {
                convertedQuery[key] = value.map((subQuery: any) => convertParamsForAggregation(subQuery, prefix));
            } else {
                const updatedKey = prefix ? `${prefix}.${key}` : key;

                if (typeof value === 'object' && !Array.isArray(value)) {
                    convertedQuery[updatedKey] = convertParamsForAggregation(value, updatedKey);
                } else {
                    convertedQuery[updatedKey] = value;
                }
            }
        }
    }

    return convertedQuery;
}
