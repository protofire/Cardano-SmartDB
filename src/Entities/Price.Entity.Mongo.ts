import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorator.MongoAppliedFor';
import { PriceEntity } from './Price.Entity';
import { SignedMessage } from "lucid-cardano";
import { CS, TN } from '../Commons';
import { BaseEntityMongo } from './Base/Base.Entity.Mongo';

@MongoAppliedFor([PriceEntity])
export class PriceEntityMongo extends BaseEntityMongo {
    protected static Entity = PriceEntity;
    protected static _mongoTableName: string = PriceEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof PriceEntityMongo {
        return this.constructor as typeof PriceEntityMongo;
    }

    public static getMongoStatic(): typeof PriceEntityMongo {
        return this as typeof PriceEntityMongo;
    }

    public getStatic(): typeof PriceEntity {
        return this.getMongoStatic().getStatic() as typeof PriceEntity;
    }

    public static getStatic(): typeof PriceEntity {
        return this.Entity as typeof PriceEntity;
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
            CS: CS;
            TN_Hex: TN;
            TN_Str: TN;
            date: Date;
            priceADAx1e6: string;
            signature: SignedMessage;
        }

        const schema = new Schema<Interface>({
            CS: { type: String, required: false },
            TN_Hex: { type: String, required: false },
            TN_Str: { type: String, required: false },
            date: { type: Date, required: false },
            priceADAx1e6: { type: String, required: false },
            signature: { type: Object, required: false },
        });

        const ModelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}
