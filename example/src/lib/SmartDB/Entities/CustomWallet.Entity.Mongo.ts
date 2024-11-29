import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { CustomWalletEntity } from './CustomWallet.Entity';
import { MongoAppliedFor } from 'smart-db';
import { PaymentKeyHash, StakeKeyHash } from 'lucid-cardano';
import { BaseEntityMongo, BaseSmartDBEntityMongo, IBaseSmartDBEntity } from 'smart-db/backEnd';

@MongoAppliedFor([CustomWalletEntity])
export class CustomWalletEntityMongo extends BaseEntityMongo {
    protected static Entity = CustomWalletEntity;
    protected static _mongoTableName: string = CustomWalletEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof CustomWalletEntityMongo {
        return this.constructor as typeof CustomWalletEntityMongo;
    }

    public static getMongoStatic(): typeof CustomWalletEntityMongo {
        return this as typeof CustomWalletEntityMongo;
    }

    public getStatic(): typeof CustomWalletEntity {
        return this.getMongoStatic().getStatic() as typeof CustomWalletEntity;
    }

    public static getStatic(): typeof CustomWalletEntity {
        return this.Entity as typeof CustomWalletEntity;
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
            custom: string;
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
            custom: { type: String, required: false },
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
