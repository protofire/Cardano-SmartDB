import { Schema, model, models } from 'mongoose';
import { MongoAppliedFor } from '../Commons/Decorators/Decorator.MongoAppliedFor.js';
import { BaseEntityMongo } from './Base/Base.Entity.Mongo.js';
import { JobEntity } from './Job.Entity.js';
import 'reflect-metadata';

@MongoAppliedFor([JobEntity])
export class JobEntityMongo extends BaseEntityMongo {
    protected static Entity = JobEntity;
    protected static _mongoTableName: string = JobEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof JobEntityMongo {
        return this.constructor as typeof JobEntityMongo;
    }

    public static getMongoStatic(): typeof JobEntityMongo {
        return this as typeof JobEntityMongo;
    }

    public getStatic(): typeof JobEntity {
        return this.getMongoStatic().getStatic() as typeof JobEntity;
    }

    public static getStatic(): typeof JobEntity {
        return this.Entity as typeof JobEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }

    // #endregion internal class methods

    // #region mongo db

    public static MongoModel() {
        interface Interface {
            name: string;
            status: string;
            message: string;
            result: boolean;
            error: string;
        }

        const schema = new Schema<Interface>({
            name: { type: String, required: false },
            status: { type: String, required: false },
            message: { type: String, required: false },
            result: { type: Boolean, required: false },
            error: { type: String, required: false },
        });

        const ModelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}
