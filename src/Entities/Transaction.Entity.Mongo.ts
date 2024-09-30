import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorators/Decorator.MongoAppliedFor.js';
import { TransactionEntity } from './Transaction.Entity.js';
import { OutRef, PaymentKeyHash, UTxO } from 'lucid-cardano';
import { BaseEntityMongo } from './Base/Base.Entity.Mongo.js';
import { TransactionDatum, TransactionRedeemer } from '../Commons/index.js';

@MongoAppliedFor([TransactionEntity])
export class TransactionEntityMongo extends BaseEntityMongo {
    protected static Entity = TransactionEntity;
    protected static _mongoTableName: string = TransactionEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof TransactionEntityMongo {
        return this.constructor as typeof TransactionEntityMongo;
    }

    public static getMongoStatic(): typeof TransactionEntityMongo {
        return this as typeof TransactionEntityMongo;
    }

    public getStatic(): typeof TransactionEntity {
        return this.getMongoStatic().getStatic() as typeof TransactionEntity;
    }

    public static getStatic(): typeof TransactionEntity {
        return this.Entity as typeof TransactionEntity;
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
        interface Interface extends Document {
            hash: string;
            paymentPKH: PaymentKeyHash;
            date: Date;
            type: string;
            status: string;
            error: Object;
            ids: Record<string, string>;
            redeemers: Record<string, TransactionRedeemer>;
            datums: Record<string, TransactionDatum>;
            consuming_UTxOs: OutRef[];
            reading_UTxOs: OutRef[];
        }

        const schema = new Schema<Interface>(
            {
                hash: { type: String, required: false, index: true },
                paymentPKH: { type: String, required: true, index: true },
                date: { type: Date, required: true, index: -1 },
                type: { type: String, required: true, index: true },
                status: { type: String, required: true, index: true },
                error: { type: Object, required: false },
                ids: { type: Object, required: false },
                redeemers: { type: Object, required: false },
                datums: { type: Object, required: false },
                consuming_UTxOs: { type: [Object], required: false },
                reading_UTxOs: { type: [Object], required: false },
            },
            { timestamps: true }
        );

        // Compound Index example
        schema.index({ 'ids.fund_id': 1, date: -1 });
        schema.index({ paymentPKH: 1, date: -1 });
        schema.index({ type: 1, date: -1 });
        schema.index({ status: 1, date: -1 });
        schema.index({ hash: 1, date: -1 });

        const ModelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}
