import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorator.MongoAppliedFor';
import { AddressToFollowEntity } from './AddressToFollow.Entity';
import { BaseEntityMongo } from './Base/Base.Entity.Mongo';

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

    public static MongoModel() {
        interface Interface {
            address: string;
            currencySymbol: string;
            tokenName: string;
            txCount: number;
            apiRouteToCall: string;
            datumType: string;
        }

        const schema = new Schema<Interface>({
            address: { type: String, required: true },
            currencySymbol: { type: String, required: true },
            tokenName: { type: String, required: false },
            txCount: { type: Number, required: true },
            apiRouteToCall: { type: String, required: true },
            datumType: { type: String, required: true },
        });

        const modelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return modelDB;
    }

    // #endregion mongo db
}
