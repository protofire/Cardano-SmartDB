import 'reflect-metadata';
// import { Convertible } from '../Commons/index.js';
import { BaseEntity } from './Base/Base.Entity.js';
import { Convertible } from '../Commons/Decorators/Decorator.Convertible.js';
import { LucidLUCID_NETWORK_MAINNET_NAME, asEntity } from '../Commons/index.js';

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
    welcomeMessageIndex!: string;

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
    oracle_wallet_publickey!: string;
    // es la wallet utilizada para validar comunicaciones desde este sitio a los contratos
    // el Pub Key es para setear en el Datum del Protocolo

    @Convertible({})
    oracle_internal_wallet_publickey_cborhex!: string;
    // es la wallet usada para validar las comunicaciones de este sitio con el api del oaculo
    // en realidad la unica que hay que setear de verdad es la public key

    // #endregion fields

    // #region class methods

    public getblockfrost_url_explorer_tx(hash: string) {
        const url = process.env.NEXT_PUBLIC_CARDANO_NET === LucidLUCID_NETWORK_MAINNET_NAME ? this.blockfrost_url_explorer_mainnet : this.blockfrost_url_explorer_preview;
        return `${url}tx/${hash}`;
    }
    public getblockfrost_url_explorer_utxo(utxo: string) {
        const url = process.env.NEXT_PUBLIC_CARDANO_NET === LucidLUCID_NETWORK_MAINNET_NAME ? this.blockfrost_url_explorer_mainnet : this.blockfrost_url_explorer_preview;
        return `${url}tx/${utxo}`;
    }
    public getblockfrost_url_explorer_address(address: string) {
        const url = process.env.NEXT_PUBLIC_CARDANO_NET === LucidLUCID_NETWORK_MAINNET_NAME ? this.blockfrost_url_explorer_mainnet : this.blockfrost_url_explorer_preview;
        return `${url}address/${address}`;
    }
    public getblockfrost_url_explorer_policy(cs: string) {
        const url = process.env.NEXT_PUBLIC_CARDANO_NET === LucidLUCID_NETWORK_MAINNET_NAME ? this.blockfrost_url_explorer_mainnet : this.blockfrost_url_explorer_preview;
        return `${url}policy/${cs}`;
    }
    // #endregion class methods
}
