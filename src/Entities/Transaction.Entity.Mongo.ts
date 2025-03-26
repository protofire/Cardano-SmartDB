import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorators/Decorator.MongoAppliedFor.js';
import { TransactionEntity } from './Transaction.Entity.js';
import { OutRef, PaymentKeyHash, UTxO } from '@lucid-evolution/lucid';
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

    public static DBModel() {
        interface Interface extends Document {
            hash: string;
            paymentPKH: PaymentKeyHash;
            date: Date;
            type: string;
            status: string;
            error: Object;
            parse_info: string;
            ids: Record<string, string | undefined>;
            redeemers: Record<string, TransactionRedeemer>;
            datums: Record<string, TransactionDatum>;
            consuming_UTxOs: UTxO[];
            reading_UTxOs: UTxO[];
            valid_from: number;
            valid_until: number;
            unit_mem: number;
            unit_steps: number;
            fee: number;
            size: number;
            CBORHex: string;
            createdAt: Date;
            updatedAt: Date;
        }

        const schema = new Schema<Interface>(
            {
                hash: { type: String, required: false, index: true },
                paymentPKH: { type: String, required: true, index: true },
                date: { type: Date, required: true, index: -1 },
                type: { type: String, required: true, index: true },
                status: { type: String, required: true, index: true },
                error: { type: Object, required: false },
                parse_info: { type: String, required: false },
                ids: { type: Object, required: false },
                redeemers: { type: Object, required: false },
                datums: { type: Object, required: false },
                consuming_UTxOs: { type: [Object], required: false },
                reading_UTxOs: { type: [Object], required: false },
                valid_from: { type: Number, required: false },
                valid_until: { type: Number, required: false },
                unit_mem: { type: Number, required: false },
                unit_steps: { type: Number, required: false },
                fee: { type: Number, required: false },
                size: { type: Number, required: false },
                CBORHex: { type: String, required: false },
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
