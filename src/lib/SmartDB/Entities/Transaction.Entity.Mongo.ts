import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorator.MongoAppliedFor';
import { TransactionEntity } from './Transaction.Entity';
import { PaymentKeyHash, UTxO } from 'lucid-cardano';
import { BaseEntityMongo } from './Base/Base.Entity.Mongo';
import { TransactionDatum, TransactionRedeemer } from '../Commons';

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
            paymentPKH: PaymentKeyHash;
            date: Date;
            type: string;
            status: string;
            error: Object;
            hash: string;
            ids: Record<string, string>;
            redeemers: Record<string, TransactionRedeemer>;
            datums: Record<string, TransactionDatum>;
            consuming_UTxOs: UTxO[];
        }

        const schema = new Schema<Interface>(
            {
                paymentPKH: { type: String, required: true, index: true },
                date: { type: Date, required: true, index: -1 },
                type: { type: String, required: true, index: true },
                status: { type: String, required: true, index: true },
                error: { type: Object, required: false },
                hash: { type: String, required: true, index: true },
                ids: { type: Object, required: true },
                redeemers: { type: Object, required: true },
                datums: { type: Object, required: true },
                consuming_UTxOs: { type: [Object], required: false },
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
