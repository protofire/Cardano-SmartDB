import crypto from 'crypto';
import { getGlobalSettings } from '../Commons/BackEnd/globalSettings.js';
import { BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import { console_log, isFrontEndEnvironment } from '../Commons/index.BackEnd.js';
import { SiteSettingsEntity } from '../Entities/SiteSettings.Entity.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';

@BackEndAppliedFor(SiteSettingsEntity)
export class SiteSettingsBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = SiteSettingsEntity;
    protected static _BackEndMethods = BaseBackEndMethods;
    // #region class methods

    public static async createInit(): Promise<SiteSettingsEntity> {
        //-------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        let siteSettings = await this.getOneByParams_<SiteSettingsEntity>({ name: 'Init' });
        if (siteSettings !== undefined) {
            console_log(0, this._Entity.className(), `Site Settings already exists`);
            return siteSettings;
        }

        const siteSecret: string = crypto.randomBytes(32).toString('hex');
        const corsAllowedOrigin: string = '*';

        const debug = process.env.NODE_ENV === 'development';
        // const use_blockchain_time = process.env.NEXT_PUBLIC_USE_BLOCKCHAIN_TIME;
        // const cardano_network = process.env.NEXT_PUBLIC_CARDANO_NET;

        const blockfrost_url_api_mainnet = process.env.NEXT_PUBLIC_BLOCKFROST_URL_MAINNET;
        const blockfrost_url_explorer_mainnet = process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_MAINNET;

        const blockfrost_url_api_preview = process.env.NEXT_PUBLIC_BLOCKFROST_URL_PREVIEW;
        const blockfrost_url_explorer_preview = process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_PREVIEW;

        const blockfrost_url_api_preprod = process.env.NEXT_PUBLIC_BLOCKFROST_URL_PREPROD;
        const blockfrost_url_explorer_preprod = process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_PREPROD;

        const oracle_wallet_publickey = process.env.NEXT_PUBLIC_ORACLE_WALLET_PUBLICKEY;
        // const oracle_internal_wallet_privatekey_cborhex = process.env.ORACLE_INTERNAL_WALLET_PRIVATEKEY_CBORHEX;
        const oracle_internal_wallet_publickey_cborhex = process.env.NEXT_PUBLIC_ORACLE_INTERNAL_WALLET_PUBLICKEY_CBORHEX;
        //-------------------------
        siteSettings = new SiteSettingsEntity({
            name: 'Init',
            siteSecret,
            corsAllowedOrigin,
            debug,
            // use_blockchain_time,
            // cardano_network,
            blockfrost_url_api_mainnet,
            blockfrost_url_explorer_mainnet,
            blockfrost_url_api_preview,
            blockfrost_url_explorer_preview,
            blockfrost_url_api_preprod,
            blockfrost_url_explorer_preprod,
            oracle_wallet_publickey,
            // oracle_internal_wallet_privatekey_cborhex,
            oracle_internal_wallet_publickey_cborhex,
        });
        //-------------------------
        const siteSettings_ = await this.create(siteSettings);
        //-------------------------
        return siteSettings_;
    }

    public static async refreshServerSiteSettings(): Promise<boolean> {
        //-------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        await getGlobalSettings(true);
        //-------------------------
        return true;
    }

    // #endregion class methods
}
