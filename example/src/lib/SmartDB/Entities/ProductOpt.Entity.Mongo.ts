
import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from 'smart-db';
import { BaseEntityMongo } from 'smart-db/backEnd';
import { ProductOptEntity } from './ProductOpt.Entity';
import { Maybe } from 'yup';

@MongoAppliedFor([ProductOptEntity])
export class ProductOptEntityMongo extends BaseEntityMongo {
    protected static Entity = ProductOptEntity;
    protected static _mongoTableName: string = ProductOptEntity.className();

    // #region internal class methods

    public getMongoStatic(): typeof ProductOptEntityMongo {
        return this.constructor as typeof ProductOptEntityMongo;
    }

    public static getMongoStatic(): typeof ProductOptEntityMongo {
        return this as typeof ProductOptEntityMongo;
    }

    public getStatic(): typeof ProductOptEntity {
        return this.getMongoStatic().getStatic() as typeof ProductOptEntity;
    }

    public static getStatic(): typeof ProductOptEntity {
        return this.Entity as typeof ProductOptEntity;
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
            deletedAt?: Maybe<Date>; // Campo opcional para soft delete
        }

        const schema = new Schema<ProductInterface>({
            name: { type: String, required: true },
            description: { type: String, required: true },
            price: { type: Number, required: true },
            stock: { type: Number, required: true },
            category: { type: String, required: true, index: true }, // Índice en la categoría
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
            deletedAt: { type: Date, select: false }, // Soft delete con select false
        });

        schema.index({ name: 1, category: 1 }); // Índice compuesto en nombre y categoría

        const ModelDB = models[this._mongoTableName] || model<ProductInterface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}
