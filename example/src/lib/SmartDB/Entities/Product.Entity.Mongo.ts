
import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor  } from 'smart-db';
import { BaseEntityMongo  } from 'smart-db/backEnd';
import { ProductEntity } from './Product.Entity';

@MongoAppliedFor([ProductEntity])
export class ProductEntityMongo extends BaseEntityMongo  {
    protected static Entity = ProductEntity;
    protected static _mongoTableName: string = ProductEntity.className();

    // #region fields

    // name:String
    // description:String
    // precio:Int

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof ProductEntityMongo {
        return this.constructor as typeof ProductEntityMongo;
    }

    public static getMongoStatic(): typeof ProductEntityMongo {
        return this as typeof ProductEntityMongo;
    }

    public getStatic(): typeof ProductEntity {
        return this.getMongoStatic().getStatic() as typeof ProductEntity;
    }

    public static getStatic(): typeof ProductEntity {
        return this.Entity as typeof ProductEntity;
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
            description: string;
            precio: number;
        }

        const schema = new Schema<Interface>({
            name: { type: String, required: false },
            description: { type: String, required: true },
            precio: { type: Number, required: true },
        });

        const ModelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}

