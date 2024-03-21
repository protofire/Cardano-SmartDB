import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorator.MongoAppliedFor';
import { PriceEntity } from './Price.Entity';
import { SignedMessage } from "lucid-cardano";
import { CS, TN } from '../Commons';
import { BaseEntityMongo } from './Base/Base.Entity.Mongo';
import { PriceHistoricEntity } from './Price.Historic.Entity';
import { PriceEntityMongo } from './Price.Entity.Mongo';

@MongoAppliedFor([PriceHistoricEntity])
export class PriceHistoricEntityMongo extends PriceEntityMongo {
    protected static Entity = PriceHistoricEntity;
    protected static _mongoTableName: string = PriceHistoricEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof PriceHistoricEntityMongo {
        return this.constructor as typeof PriceHistoricEntityMongo;
    }

    public static getMongoStatic(): typeof PriceHistoricEntityMongo {
        return this as typeof PriceHistoricEntityMongo;
    }

    public getStatic(): typeof PriceHistoricEntity {
        return this.getMongoStatic().getStatic() as typeof PriceHistoricEntity;
    }

    public static getStatic(): typeof PriceHistoricEntity {
        return this.Entity as typeof PriceHistoricEntity;
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
        }

        const schema = new Schema<Interface>({
            CS: { type: String, required: false },
            TN_Hex: { type: String, required: false },
            TN_Str: { type: String, required: false },
            date: { type: Date, required: false },
            priceADAx1e6: { type: String, required: false },
        });

        const ModelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}
