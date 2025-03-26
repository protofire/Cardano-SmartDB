import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorators/Decorator.MongoAppliedFor.js';
import { AddressToFollowEntity } from './AddressToFollow.Entity.js';
import { BaseEntityMongo } from './Base/Base.Entity.Mongo.js';

@MongoAppliedFor([AddressToFollowEntity])
export class AddressToFollowEntityMongo extends BaseEntityMongo {
    protected static Entity = AddressToFollowEntity;
    protected static _mongoTableName: string = AddressToFollowEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof AddressToFollowEntityMongo {
        return this.constructor as typeof AddressToFollowEntityMongo;
    }

    public static getMongoStatic(): typeof AddressToFollowEntityMongo {
        return this as typeof AddressToFollowEntityMongo;
    }

    public getStatic(): typeof AddressToFollowEntity {
        return this.getMongoStatic().getStatic() as typeof AddressToFollowEntity;
    }

    public static getStatic(): typeof AddressToFollowEntity {
        return this.Entity as typeof AddressToFollowEntity;
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
            address: string;
            CS: string;
            TN_Str: string;
            txCount: number;
            apiRouteToCall: string;
            datumType: string;
            createdAt: Date;
            updatedAt: Date;
        }

        const schema = new Schema<Interface>(
            {
                address: { type: String, required: true },
                CS: { type: String, required: true },
                TN_Str: { type: String, required: false },
                txCount: { type: Number, required: true },
                apiRouteToCall: { type: String, required: true },
                datumType: { type: String, required: true },
            },
            { timestamps: true }
        );

        const modelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return modelDB;
    }

    // #endregion mongo db
}
