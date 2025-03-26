import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorators/Decorator.MongoAppliedFor.js';
import { SiteSettingsEntity } from './SiteSettings.Entity.js';
import { BaseEntityMongo } from './Base/Base.Entity.Mongo.js';

@MongoAppliedFor([SiteSettingsEntity])
export class SiteSettingsEntityMongo extends BaseEntityMongo {
    protected static Entity = SiteSettingsEntity;
    protected static _mongoTableName: string = SiteSettingsEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof SiteSettingsEntityMongo {
        return this.constructor as typeof SiteSettingsEntityMongo;
    }

    public static getMongoStatic(): typeof SiteSettingsEntityMongo {
        return this as typeof SiteSettingsEntityMongo;
    }

    public getStatic(): typeof SiteSettingsEntity {
        return this.getMongoStatic().getStatic() as typeof SiteSettingsEntity;
    }

    public static getStatic(): typeof SiteSettingsEntity {
        return this.Entity as typeof SiteSettingsEntity;
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
            siteSecret: string;
            corsAllowedOrigin: string;
            debug: boolean;
            welcomeMessage: string;
            welcomeMessageIndex: number;
            // use_blockchain_time: boolean;
            // cardano_network: string;
            blockfrost_url_api_mainnet: string;
            blockfrost_url_explorer_mainnet: string;
            blockfrost_url_api_preview: string;
            blockfrost_url_explorer_preview: string;
            blockfrost_url_api_preprod: string;
            blockfrost_url_explorer_preprod: string;
            taptools_url_explorer_mainnet: string;
            oracle_wallet_publickey_cborhex: string;
            oracle_internal_wallet_publickey_cborhex: string;
            createdAt: Date;
            updatedAt: Date;
        }

        const schema = new Schema<Interface>(
            {
                name: { type: String, required: true, unique: true },
                siteSecret: { type: String, required: false },
                corsAllowedOrigin: { type: String, required: false },
                debug: { type: Boolean, required: false },
                welcomeMessage: { type: String, required: false },
                welcomeMessageIndex: { type: Number, required: false },
                // use_blockchain_time: { type: Boolean, required: false },
                // cardano_network: { type: String, required: false },
                blockfrost_url_api_mainnet: { type: String, required: false },
                blockfrost_url_explorer_mainnet: { type: String, required: false },
                blockfrost_url_api_preview: { type: String, required: false },
                blockfrost_url_explorer_preview: { type: String, required: false },
                blockfrost_url_api_preprod: { type: String, required: false },
                blockfrost_url_explorer_preprod: { type: String, required: false },
                taptools_url_explorer_mainnet: { type: String, required: false },
                oracle_wallet_publickey_cborhex: { type: String, required: false },
                oracle_internal_wallet_publickey_cborhex: { type: String, required: false },
            },
            { timestamps: true }
        );

        const modelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return modelDB;
    }

    // #endregion mongo db
}
