import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorator.MongoAppliedFor';
import { WalletEntity } from './Wallet.Entity';
import { PaymentKeyHash, StakeKeyHash } from 'lucid-cardano';
import { BaseEntityMongo } from './Base/Base.Entity.Mongo';

@MongoAppliedFor([WalletEntity])
export class WalletEntityMongo extends BaseEntityMongo {
    protected static Entity = WalletEntity;
    protected static _mongoTableName: string = WalletEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof WalletEntityMongo {
        return this.constructor as typeof WalletEntityMongo;
    }

    public static getMongoStatic(): typeof WalletEntityMongo {
        return this as typeof WalletEntityMongo;
    }

    public getStatic(): typeof WalletEntity {
        return this.getMongoStatic().getStatic() as typeof WalletEntity;
    }

    public static getStatic(): typeof WalletEntity {
        return this.Entity as typeof WalletEntity;
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
            createdAt: Date;
            createdBy: string;
            lastConnection: Date;
            walletUsed: string;
            walletValidatedWithSignedToken: boolean;
            paymentPKH: PaymentKeyHash;
            stakePKH: StakeKeyHash;
            name: string;
            email: string;
            isCoreTeam: boolean;
            testnet_address: string;
            mainnet_address: string;
        }

        const schema = new Schema<Interface>({
            createdAt: { type: Date, required: false },
            createdBy: { type: String, required: false },
            lastConnection: { type: Date, required: false },
            walletUsed: { type: String, required: false },
            walletValidatedWithSignedToken: { type: Boolean, required: false },
            paymentPKH: { type: String, required: true },
            stakePKH: { type: String, required: false },
            name: { type: String, required: false },
            email: { type: String, required: false },
            isCoreTeam: { type: Boolean, required: false },
            testnet_address: { type: String, required: false },
            mainnet_address: { type: String, required: false },
        });

        const ModelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}
