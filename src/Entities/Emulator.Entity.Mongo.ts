import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorators/Decorator.MongoAppliedFor.js';
import { EmulatorEntity } from './Emulator.Entity.js';
import { PrivateKey } from '@lucid-evolution/lucid';
import { BaseEntityMongo } from './Base/Base.Entity.Mongo.js';

@MongoAppliedFor([EmulatorEntity])
export class EmulatorEntityMongo extends BaseEntityMongo {
    protected static Entity = EmulatorEntity;
    protected static _mongoTableName: string = EmulatorEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof EmulatorEntityMongo {
        return this.constructor as typeof EmulatorEntityMongo;
    }

    public static getMongoStatic(): typeof EmulatorEntityMongo {
        return this as typeof EmulatorEntityMongo;
    }

    public getStatic(): typeof EmulatorEntity {
        return this.getMongoStatic().getStatic() as typeof EmulatorEntity;
    }

    public static getStatic(): typeof EmulatorEntity {
        return this.Entity as typeof EmulatorEntity;
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
            name: string;
            current: boolean;
            emulator: Object;
            zeroTime: number;
            privateKeys: PrivateKey[];
            createdAt: Date;
            updatedAt: Date;
        }

        const schema = new Schema<Interface>(
            {
                name: { type: String, required: true, unique: true },
                current: { type: Boolean, required: true },
                emulator: { type: Object, required: true },
                zeroTime: { type: Number, required: true },
                privateKeys: { type: [String], required: true },
            },
            { timestamps: true }
        );

        const ModelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}
