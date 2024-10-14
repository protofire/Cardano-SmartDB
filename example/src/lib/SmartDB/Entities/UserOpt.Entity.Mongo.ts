
import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from 'smart-db';
import { BaseEntityMongo } from 'smart-db/backEnd';
import { UserNoOptEntity } from './UserNoOpt.Entity';

@MongoAppliedFor([UserNoOptEntity])
export class UserNoOptEntityMongo extends BaseEntityMongo {
    protected static Entity = UserNoOptEntity;
    protected static _mongoTableName: string = UserNoOptEntity.className();

    // #region internal class methods

    public getMongoStatic(): typeof UserNoOptEntityMongo {
        return this.constructor as typeof UserNoOptEntityMongo;
    }

    public static getMongoStatic(): typeof UserNoOptEntityMongo {
        return this as typeof UserNoOptEntityMongo;
    }

    public getStatic(): typeof UserNoOptEntity {
        return this.getMongoStatic().getStatic() as typeof UserNoOptEntity;
    }

    public static getStatic(): typeof UserNoOptEntity {
        return this.Entity as typeof UserNoOptEntity;
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
        interface UserInterface {
            firstName: string;
            lastName: string;
            email: string;
            password: string;
            birthDate: Date;
            createdAt: Date;
            updatedAt: Date;
        }

        const schema = new Schema<UserInterface>({
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true },
            password: { type: String, required: true },
            birthDate: { type: Date, required: true },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
        });

        const ModelDB = models[this._mongoTableName] || model<UserInterface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}

