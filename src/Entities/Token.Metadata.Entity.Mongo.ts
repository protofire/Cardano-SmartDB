import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorators/Decorator.MongoAppliedFor.js';
import { TokenMetadataEntity } from './Token.Metadata.Entity.js';
import { CS, TN } from '../Commons/index.js';
import { BaseEntityMongo } from './Base/Base.Entity.Mongo.js';

@MongoAppliedFor([TokenMetadataEntity])
export class TokenMetadataEntityMongo extends BaseEntityMongo {
    protected static Entity = TokenMetadataEntity;
    protected static _mongoTableName: string = TokenMetadataEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof TokenMetadataEntityMongo {
        return this.constructor as typeof TokenMetadataEntityMongo;
    }

    public static getMongoStatic(): typeof TokenMetadataEntityMongo {
        return this as typeof TokenMetadataEntityMongo;
    }

    public getStatic(): typeof TokenMetadataEntity {
        return this.getMongoStatic().getStatic() as typeof TokenMetadataEntity;
    }

    public static getStatic(): typeof TokenMetadataEntity {
        return this.Entity as typeof TokenMetadataEntity;
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
            CS: CS;
            TN_Hex: TN;
            TN_Str: TN;
            decimals: number;
            image: string;
            colorHex: string;
            metadata_raw: any;
            swMetadataGenerated: boolean;
        }

        const schema = new Schema<Interface>({
            CS: { type: String, required: false },
            TN_Hex: { type: String, required: false },
            TN_Str: { type: String, required: false },
            decimals:{ type: Number, required: false },
            image: { type: String, required: false },
            colorHex:{ type: String, required: false },
            metadata_raw: { type: Object, required: false },
            swMetadataGenerated: { type: Boolean, required: false },
        });

        const modelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return modelDB;
    }

    // #endregion mongo db
}
