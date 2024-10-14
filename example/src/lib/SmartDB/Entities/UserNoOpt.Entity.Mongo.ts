
import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { Maybe, MongoAppliedFor } from 'smart-db';
import { BaseEntityMongo } from 'smart-db/backEnd';
import { UserOptEntity } from './UserOpt.Entity';

@MongoAppliedFor([UserOptEntity])
export class UserOptEntityMongo extends BaseEntityMongo {
    protected static Entity = UserOptEntity;
    protected static _mongoTableName: string = UserOptEntity.className();

    // #region internal class methods

    public getMongoStatic(): typeof UserOptEntityMongo {
        return this.constructor as typeof UserOptEntityMongo;
    }

    public static getMongoStatic(): typeof UserOptEntityMongo {
        return this as typeof UserOptEntityMongo;
    }

    public getStatic(): typeof UserOptEntity {
        return this.getMongoStatic().getStatic() as typeof UserOptEntity;
    }

    public static getStatic(): typeof UserOptEntity {
        return this.Entity as typeof UserOptEntity;
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
            password?: Maybe<string>; // Campo opcional para que no siempre sea necesario
            birthDate: Date;
            createdAt: Date;
            updatedAt: Date;
        }

        const schema = new Schema<UserInterface>({
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true, unique: true }, // Índice único en email
            password: { type: String, select: false }, // No seleccionar password por defecto
            birthDate: { type: Date, required: true },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
        });

        schema.index({ firstName: 1, lastName: 1 }); // Índice compuesto en firstName y lastName

        const ModelDB = models[this._mongoTableName] || model<UserInterface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}

