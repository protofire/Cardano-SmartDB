import { type PaymentKeyHash } from 'lucid-cardano';
import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { Maybe, MongoAppliedFor } from 'smart-db';
import { BaseEntityMongo } from 'smart-db/backEnd';
import { TestEntity } from './Test.Entity';

@MongoAppliedFor([TestEntity])
export class TestEntityMongo extends BaseEntityMongo {
    protected static Entity = TestEntity;
    protected static _mongoTableName: string = TestEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof TestEntityMongo {
        return this.constructor as typeof TestEntityMongo;
    }

    public static getMongoStatic(): typeof TestEntityMongo {
        return this as typeof TestEntityMongo;
    }

    public getStatic(): typeof TestEntity {
        return this.getMongoStatic().getStatic() as typeof TestEntity;
    }

    public static getStatic(): typeof TestEntity {
        return this.Entity as typeof TestEntity;
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
            name: PaymentKeyHash;
            description: Maybe<PaymentKeyHash>;
        }

        const schema = new Schema<Interface>({
            name: { type: String, required: true },
            description: { type: String, required: true },
        });

        const ModelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}
