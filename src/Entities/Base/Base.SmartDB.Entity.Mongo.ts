import { PaymentKeyHash } from '@lucid-evolution/lucid';
import { Schema, Types } from 'mongoose';
import 'reflect-metadata';
import { BaseEntityMongo } from './Base.Entity.Mongo.js';
import { BaseSmartDBEntity } from './Base.SmartDB.Entity.js';

export interface IBaseSmartDBEntity {
    _creator: PaymentKeyHash;
    _NET_address: string;
    _NET_id_CS: string | undefined;
    _NET_id_TN_Str: string | undefined;
    _isDeployed: boolean;
    smartUTxO_id: Types.ObjectId | undefined;
}

// @MongoAppliedFor([BaseSmartDBEntity])
export class BaseSmartDBEntityMongo extends BaseEntityMongo {
    protected static Entity = BaseSmartDBEntity;
    // protected static _mongoTableName: string;

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof BaseSmartDBEntityMongo {
        return this.constructor as typeof BaseSmartDBEntityMongo;
    }

    public static getMongoStatic(): typeof BaseSmartDBEntityMongo {
        return this as typeof BaseSmartDBEntityMongo;
    }

    public getStatic(): typeof BaseSmartDBEntity {
        return this.getMongoStatic().getStatic() as typeof BaseSmartDBEntity;
    }

    public static getStatic(): typeof BaseSmartDBEntity {
        return this.Entity as typeof BaseSmartDBEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }
    // #endregion internal class methods

    // #region mongo db

    public static smartDBSchema = {
        _creator: { type: String, required: true },
        _NET_address: { type: String, required: true },
        _NET_id_CS: { type: String, required: true },
        _NET_id_TN_Str: { type: String, required: true },
        _isDeployed: { type: Boolean, required: true },
        smartUTxO_id: { type: Schema.Types.ObjectId, ref: 'smartutxo', required: false },
    };

    // #endregion mongo db
}
