
import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor  } from 'smart-db';
import { BaseEntityMongo  } from 'smart-db/backEnd';
import { ProductoEntity } from './Producto.Entity';

@MongoAppliedFor([ProductoEntity])
export class ProductoEntityMongo extends BaseEntityMongo  {
    protected static Entity = ProductoEntity;
    protected static _mongoTableName: string = ProductoEntity.className();

    // #region fields

    // name:String
    // description:String
    // precio:Int

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof ProductoEntityMongo {
        return this.constructor as typeof ProductoEntityMongo;
    }

    public static getMongoStatic(): typeof ProductoEntityMongo {
        return this as typeof ProductoEntityMongo;
    }

    public getStatic(): typeof ProductoEntity {
        return this.getMongoStatic().getStatic() as typeof ProductoEntity;
    }

    public static getStatic(): typeof ProductoEntity {
        return this.Entity as typeof ProductoEntity;
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

