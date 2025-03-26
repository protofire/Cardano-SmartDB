import 'reflect-metadata';
// import { Convertible } from '../Commons/index.js';
import { Convertible } from '../Commons/Decorators/Decorator.Convertible.js';
import { asEntity, isMainnet } from '../Commons/index.js';
import { BaseEntity } from './Base/Base.Entity.js';

@asEntity()
export class SiteSettingsEntity extends BaseEntity {
    protected static _className: string = 'Site';
    protected static _apiRoute: string = 'site-settings';

    // #region fields

    @Convertible({ isUnique: true })
    name!: string;

    @Convertible({})
    siteSecret!: string;

    @Convertible({})
    corsAllowedOrigin!: string;

    @Convertible({})
    debug!: boolean;

    @Convertible({})
    welcomeMessage!: string;

    @Convertible({})
    welcomeMessageIndex!: number;

    // @Convertible({})
    // use_blockchain_time!: boolean;

    // @Convertible({})
    // cardano_network!: string;

    @Convertible({})
    blockfrost_url_api_mainnet!: string;

    @Convertible({})
    blockfrost_url_explorer_mainnet!: string;

    @Convertible({})
    blockfrost_url_api_preview!: string;

    @Convertible({})
    blockfrost_url_explorer_preview!: string;

    @Convertible({})
    blockfrost_url_api_preprod!: string;

    @Convertible({})
    blockfrost_url_explorer_preprod!: string;

    @Convertible({})
    taptools_url_explorer_mainnet!: string;

    @Convertible({})
    oracle_wallet_publickey_cborhex!: string;
    // es la wallet utilizada para validar comunicaciones desde este sitio a los contratos
    // el Pub Key es para setear en el Datum del Protocolo

    @Convertible({})
    oracle_internal_wallet_publickey_cborhex!: string;
    // es la wallet usada para validar las comunicaciones de este sitio con el api del oaculo
    // en realidad la unica que hay que setear de verdad es la public key

    @Convertible({ isCreatedAt: true })
    createdAt!: Date;

    @Convertible({ isUpdatedAt: true })
    updatedAt!: Date;

    // #endregion fields

    // #region class methods

    public getblockfrost_url_explorer_tx(hash: string) {
        const url = isMainnet ? this.blockfrost_url_explorer_mainnet : this.blockfrost_url_explorer_preview;
        return `${url}tx/${hash}`;
    }
    public getblockfrost_url_explorer_utxo(utxo: string) {
        const url = isMainnet ? this.blockfrost_url_explorer_mainnet : this.blockfrost_url_explorer_preview;
        return `${url}tx/${utxo}`;
    }
    public getblockfrost_url_explorer_address(address: string) {
        const url = isMainnet ? this.blockfrost_url_explorer_mainnet : this.blockfrost_url_explorer_preview;
        return `${url}address/${address}`;
    }
    public getblockfrost_url_explorer_policy(cs: string) {
        const url = isMainnet ? this.blockfrost_url_explorer_mainnet : this.blockfrost_url_explorer_preview;
        return `${url}policy/${cs}`;
    }
    public gettaptools_url_explorer_mainnet(cs: string, tn: string) {
        const url = this.taptools_url_explorer_mainnet;
        return `${url}${cs}${tn}`;
    }

    // #endregion class methods
}
