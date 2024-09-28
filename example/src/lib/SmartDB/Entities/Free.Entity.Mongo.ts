import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from 'smart-db';
import { BaseSmartDBEntityMongo } from 'smart-db/backEnd';
import { FreeEntity } from './Free.Entity';

@MongoAppliedFor([FreeEntity])
export class FreeEntityMongo extends BaseSmartDBEntityMongo {
    protected static Entity = FreeEntity;
    protected static _mongoTableName: string = FreeEntity.className();

    // #region fields

    // fdValue:Int

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof FreeEntityMongo {
        return this.constructor as typeof FreeEntityMongo;
    }

    public static getMongoStatic(): typeof FreeEntityMongo {
        return this as typeof FreeEntityMongo;
    }

    public getStatic(): typeof FreeEntity {
        return this.getMongoStatic().getStatic() as typeof FreeEntity;
    }

    public static getStatic(): typeof FreeEntity {
        return this.Entity as typeof FreeEntity;
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
            fdValue: number;
        }

        const schema = new Schema<Interface>({
            fdValue: { type: Number, required: false },
        });

        const ModelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}
