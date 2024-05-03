import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorator.MongoAppliedFor';
import { SmartUTxOEntity } from './SmartUTxO.Entity';
import { Address, Datum, Script } from "lucid-cardano";
import { BaseEntityMongo } from './Base/Base.Entity.Mongo';
import { SmartUTxOWithDetailsEntity } from './SmartUTxO.WithDetails.Entity';

@MongoAppliedFor([SmartUTxOEntity, SmartUTxOWithDetailsEntity])
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

    public static MongoModel() {
        interface Interface {
            address: Address;
            txHash: string;
            outputIndex: number;
            isPreparing: Date | undefined;
            isConsuming: Date | undefined;
            assets: { [x: string]: string };
            datumHash: string | undefined;
            datum: Datum | undefined;
            datumObj: Object | undefined;
            scriptRef?: Script;
            _NET_id_CS: string;
            _NET_id_TN: string;
            _is_NET_id_Unique: boolean;
            datumType: string;
        }

        //TODO poner required, controlar eso
        const schema = new Schema<Interface>({
            address: { type: String, required: true , index: true},
            txHash: { type: String, required: true },
            outputIndex: { type: Number, required: true },
            isPreparing: { type: Date, index: true },
            isConsuming: { type: Date, index: true },
            assets: { type: Object, required: true },
            datumHash: { type: String },
            datum: { type: String },
            datumObj: { type: Object },
            scriptRef: { type: Object },
            _NET_id_CS: { type: String, required: true },
            _NET_id_TN: { type: String, required: true },
            _is_NET_id_Unique: { type: Boolean, required: true },
            datumType: { type: String, required: true, index: true },
        });

        schema.index({ txHash: 1, outputIndex: 1 });
        schema.index({ isPreparing: 1, isConsuming: 1 });

        const modelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return modelDB;
    }

    // #endregion mongo db
}
