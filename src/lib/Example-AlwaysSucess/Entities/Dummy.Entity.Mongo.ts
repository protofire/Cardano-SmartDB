import { MongoAppliedFor } from '@/src/lib/SmartDB/Commons/Decorator.MongoAppliedFor';
import { BaseSmartDBEntityMongo, IBaseSmartDBEntity } from '@/src/lib/SmartDB/Entities/Base/Base.SmartDB.Entity.Mongo';
import { type PaymentKeyHash } from "lucid-cardano";
import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { DummyEntity } from './Dummy.Entity';
import { CS, Maybe } from '../../SmartDB';

@MongoAppliedFor([DummyEntity])
export class DelegationEntityMongo extends BaseSmartDBEntityMongo {
    protected static Entity = DummyEntity;
    protected static _mongoTableName: string = DummyEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof DelegationEntityMongo {
        return this.constructor as typeof DelegationEntityMongo;
    }

    public static getMongoStatic(): typeof DelegationEntityMongo {
        return this as typeof DelegationEntityMongo;
    }

    public getStatic(): typeof DummyEntity {
        return this.getMongoStatic().getStatic() as typeof DummyEntity;
    }

    public static getStatic(): typeof DummyEntity {
        return this.Entity as typeof DummyEntity;
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
            ddPaymentPKH: PaymentKeyHash;
            ddStakePKH: Maybe<PaymentKeyHash>;
        }

        interface Interface extends InterfaceDB, InterfaceDatum {}

        const schemaDB = {
            ...BaseSmartDBEntityMongo.smartDBSchema,
        };

        const schemaDatum = {
            ddPaymentPKH: { type: String, required: false },
            ddStakePKH: { type: Object, required: false },
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
