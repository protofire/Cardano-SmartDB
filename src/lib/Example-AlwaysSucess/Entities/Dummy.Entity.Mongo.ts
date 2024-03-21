import { MongoAppliedFor } from '@/src/lib/SmartDB/Commons/Decorator.MongoAppliedFor';
import { BaseSmartDBEntityMongo, IBaseSmartDBEntity } from '@/src/lib/SmartDB/Entities/Base/Base.SmartDB.Entity.Mongo';
import { type PaymentKeyHash } from "lucid-cardano";
import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { Maybe, type CS } from '../Commons';
import { DelegationEntity } from './Dummy.Entity';

@MongoAppliedFor([DelegationEntity])
export class DelegationEntityMongo extends BaseSmartDBEntityMongo {
    protected static Entity = DelegationEntity;
    protected static _mongoTableName: string = DelegationEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof DelegationEntityMongo {
        return this.constructor as typeof DelegationEntityMongo;
    }

    public static getMongoStatic(): typeof DelegationEntityMongo {
        return this as typeof DelegationEntityMongo;
    }

    public getStatic(): typeof DelegationEntity {
        return this.getMongoStatic().getStatic() as typeof DelegationEntity;
    }

    public static getStatic(): typeof DelegationEntity {
        return this.Entity as typeof DelegationEntity;
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
        interface InterfaceDB extends IBaseSmartDBEntity {}
        interface InterfaceDatum {
            ddDelegationPolicyID_CS: CS;
            ddFundPolicy_CS: CS;
            ddDelegatorPaymentPKH: PaymentKeyHash;
            ddDelegatorStakePKH: Maybe<PaymentKeyHash>;
            ddDelegated_Mayz: string;
            ddMinADA: string;
        }

        interface Interface extends InterfaceDB, InterfaceDatum {}

        const schemaDB = {
            ...BaseSmartDBEntityMongo.smartDBSchema,
        };

        const schemaDatum = {
            ddDelegationPolicyID_CS: { type: String, required: false },
            ddFundPolicy_CS: { type: String, required: false },
            ddDelegatorPaymentPKH: { type: String, required: false },
            ddDelegatorStakePKH: { type: Object, required: false },
            ddDelegated_Mayz: { type: String, required: false },
            ddMinADA: { type: String, required: false },
        };

        const schema = new Schema<Interface>({
            ...schemaDB,
            ...schemaDatum,
        });

        const ModelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}
