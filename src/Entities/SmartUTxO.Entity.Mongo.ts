import { Address, Datum, Script } from '@lucid-evolution/lucid';
import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorators/Decorator.MongoAppliedFor.js';
import { BaseEntityMongo } from './Base/Base.Entity.Mongo.js';
import { SmartUTxOEntity } from './SmartUTxO.Entity.js';

@MongoAppliedFor([SmartUTxOEntity])
export class SmartUTxOEntityMongo extends BaseEntityMongo {
    protected static Entity = SmartUTxOEntity;
    protected static _mongoTableName: string = SmartUTxOEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof SmartUTxOEntityMongo {
        return this.constructor as typeof SmartUTxOEntityMongo;
    }

    public static getMongoStatic(): typeof SmartUTxOEntityMongo {
        return this as typeof SmartUTxOEntityMongo;
    }

    public getStatic(): typeof SmartUTxOEntity {
        return this.getMongoStatic().getStatic() as typeof SmartUTxOEntity;
    }

    public static getStatic(): typeof SmartUTxOEntity {
        return this.Entity as typeof SmartUTxOEntity;
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
        interface Interface {
            address: Address;
            txHash: string;
            outputIndex: number;
            isPreparingForReading: Date | undefined;
            isReading: Date | undefined;
            isPreparingForConsuming: Date | undefined;
            isConsuming: Date | undefined;
            assets: { [x: string]: string };
            datumHash: string | undefined;
            datum: Datum | undefined;
            datumObj: Object | undefined;
            scriptRef?: Script;
            _NET_id_CS: string;
            _NET_id_TN_Str: string;
            _is_NET_id_Unique: boolean;
            datumType: string;
            createdAt: Date;
            updatedAt: Date;
        }

        //TODO poner required, controlar eso
        const schema = new Schema<Interface>(
            {
                address: { type: String, required: true, index: true },
                txHash: { type: String, required: true },
                outputIndex: { type: Number, required: true },
                isPreparingForReading: { type: Date, index: true },
                isReading: { type: Date, index: true },
                isPreparingForConsuming: { type: Date, index: true },
                isConsuming: { type: Date, index: true },
                assets: { type: Object, required: true },
                datumHash: { type: String },
                datum: { type: String },
                datumObj: { type: Object },
                scriptRef: { type: Object },
                _NET_id_CS: { type: String, required: true },
                _NET_id_TN_Str: { type: String, required: true },
                _is_NET_id_Unique: { type: Boolean, required: true },
                datumType: { type: String, required: true, index: true },
            },
            { timestamps: true }
        );

        schema.index({ txHash: 1, outputIndex: 1 });
        schema.index({ isPreparingConsuming: 1, isConsuming: 1 });
        schema.index({ isPreparingReading: 1, isReading: 1 });

        const modelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return modelDB;
    }

    // #endregion mongo db
}
