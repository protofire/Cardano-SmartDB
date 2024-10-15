import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { Maybe, MongoAppliedFor } from 'smart-db';
import { BaseEntityMongo } from 'smart-db/backEnd';
import { ProductNoOptEntity } from './ProductNoOpt.Entity';

@MongoAppliedFor([ProductNoOptEntity])
export class ProductNoOptEntityMongo extends BaseEntityMongo {
    protected static Entity = ProductNoOptEntity;
    protected static _mongoTableName: string = ProductNoOptEntity.className();

    // #region internal class methods

    public getMongoStatic(): typeof ProductNoOptEntityMongo {
        return this.constructor as typeof ProductNoOptEntityMongo;
    }

    public static getMongoStatic(): typeof ProductNoOptEntityMongo {
        return this as typeof ProductNoOptEntityMongo;
    }

    public getStatic(): typeof ProductNoOptEntity {
        return this.getMongoStatic().getStatic() as typeof ProductNoOptEntity;
    }

    public static getStatic(): typeof ProductNoOptEntity {
        return this.Entity as typeof ProductNoOptEntity;
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
        interface ProductInterface {
            name: string;
            description: string;
            price: number;
            stock: number;
            category: string;
            createdAt: Date;
            updatedAt: Date;
        }

        const schema = new Schema<ProductInterface>({
            name: { type: String, required: true },
            description: { type: String, required: true },
            price: { type: Number, required: true },
            stock: { type: Number, required: true },
            category: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
        });

        const ModelDB = models[this._mongoTableName] || model<ProductInterface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}

