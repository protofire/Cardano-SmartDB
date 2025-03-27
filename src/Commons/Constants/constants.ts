import { Decimals } from '../types.js';

export * from './endpoints.js';
export * from './wallets.js';
export * from './images.js';

//----------------------------------------------------------------------
//SEO AND SOCIAL MEDIA

export const PROYECT_NAME = process.env.NEXT_PUBLIC_PROYECT_NAME || 'Smart DB';

//----------------------------------------------------------------------

export const LUCID_NETWORK_MAINNET_ID = 1;
export const LUCID_NETWORK_TESTNET_ID = 0;

//----------------------------------------------------------------------

export const LUCID_NETWORK_MAINNET_NAME = 'Mainnet';
export const LUCID_NETWORK_PREVIEW_NAME = 'Preview';
export const LUCID_NETWORK_PREPROD_NAME = 'Preprod';
export const LUCID_NETWORK_CUSTOM_NAME = 'Custom';
export const LUCID_NETWORK_EMULATOR_NAME_MOCK_NO_EXISTE_EN_LUCID = 'Emulator';

//----------------------------------------------------------------------

export const isEmulator = process.env.NEXT_PUBLIC_CARDANO_NET === LUCID_NETWORK_EMULATOR_NAME_MOCK_NO_EXISTE_EN_LUCID;
export const isTestnet =
    process.env.NEXT_PUBLIC_CARDANO_NET === LUCID_NETWORK_EMULATOR_NAME_MOCK_NO_EXISTE_EN_LUCID ||
    process.env.NEXT_PUBLIC_CARDANO_NET === LUCID_NETWORK_PREVIEW_NAME ||
    process.env.NEXT_PUBLIC_CARDANO_NET === LUCID_NETWORK_PREPROD_NAME ||
    process.env.NEXT_PUBLIC_CARDANO_NET === LUCID_NETWORK_CUSTOM_NAME;
export const isPreview = process.env.NEXT_PUBLIC_CARDANO_NET === LUCID_NETWORK_PREVIEW_NAME;
export const isPreprod = process.env.NEXT_PUBLIC_CARDANO_NET === LUCID_NETWORK_PREPROD_NAME;
export const isMainnet = process.env.NEXT_PUBLIC_CARDANO_NET === LUCID_NETWORK_MAINNET_NAME;

//----------------------------------------------------------------------

export function getLUCID_NETWORK_ID() {
    if (isMainnet) {
        return LUCID_NETWORK_MAINNET_ID;
    } else {
        return LUCID_NETWORK_TESTNET_ID;
    }
}

//----------------------------------------------------------------------
// SESSION

export const VALID_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const VALID_SESSION_DURATION_STR = '30d'; // 30 days

//----------------------------------------------------------------------
// WALLET CONNECT

export const CONNECT_WALLET_WAIT_FOR_WALLET_ACTIVATION_MS = 1 * 1000; // = 1 segundos
export const CONNECT_WALLET_WAIT_FOR_API_WALLETS_MS = 1 * 4 * 1000; // = 4 segundos
export const CONNECT_WALLET_WAIT_FOR_EXTENSIONS_POOL_WALLETS_MS = 1 * 1000; // = 1 segundos

// WALLET CREATED BY
export const WALLET_CREATEDBY_ADMIN = 'Admin';
export const WALLET_CREATEDBY_LOGIN = 'Login';

//----------------------------------------------------------------------
//FETCH WRAPPER

export const API_TIMEOUT = 1 * 10 * 1000; // = 10 segundos
export const API_TRY_AGAIN = 1 * 1000; // = 1 segundos

//----------------------------------------------------------------------
// NAVIGATION

export const NAVIGATION_TIMEOUT_MS = 10000; // 10 segundos

//----------------------------------------------------------------------
// TX BUILDING

export const VALID_TX_TIME_BEFORE_MS = 2 * 60 * 1000; // = 2 minutos
export const VALID_TX_TIME_RANGE_MS = 15 * 60 * 1000; // = 15 minutos

//------------------------------------------
//TX LIMITS

export const MAX_TX_EX_MEM = 14_000_000;
export const MAX_TX_EX_STEPS = 10_000_000_000;
export const MAX_TX_SIZE = 16_384;

//----------------------------------------------------------------------
// TX UPDATER

// tiempo que se usa para iterar y controlar las tx confirmadas
export const TX_CHECK_INTERVAL_MS = 5 * 1000; // = 5 segundos

// tiempo para esperar entre transacciones, para dar tiemp a blockfrost que todos sus endpoints se actualicen
// tiempo que se espera para que una tx se confirme y se actualicen los diferentes providers de data
export const TX_PROPAGATION_DELAY_MS = 5 * 1000; // = 5 segundos

export const TX_PREPARING_TIME_MS = 1 * 60 * 1000; // = 5 minutos
export const TX_CONSUMING_TIME_MS = 5 * 60 * 1000; // = 5 minutos
export const TX_TIMEOUT_MS = 30 * 60 * 1000; // = 30 minutos

// en emulador se usa para simular el tiempo de espera entre transacciones
export const TX_SIMULATION_SLEEP_TIME_MS = 500; // = 0.5 segundos

//----------------------------------------------------------------------
// BLOCKFRTOST

export const BLOCKFROST_RETRY_TIME_MS = 1000; // = 2 segundos
export const BLOCKFROST_URL_EPOCHS_LATEST_PARAMETERS = '/epochs/latest/parameters';
export const TIMEOUT_PROXY_BLOCKFROST_MS = 25000; // = 25 segundos

//----------------------------------------------------------------------
// FOR CALCULATING FREE AVAILABLE ADA IN WALLET

export const ADA_TX_FEE_MARGIN = 10_000_000n;

//------------------------------------------
// ORACLE

export const useOraclePrices = process.env.NEXT_PUBLIC_USE_ORACLE_PRICE !== undefined ? process.env.NEXT_PUBLIC_USE_ORACLE_PRICE === 'true' : false;

// oracleData_Valid_Time = 300,000 (5 * 60 * 1000 = 5 minutes)
// This is the real time that the oracle data is valid in the smart contract.
//TODO: reemplazar por DEFAULT_VALID_ORACLE_PRICE_TIME_MS y usarlo solo al crear el protoclo, luego leer de protocol.

export const VALID_ORACLE_PRICE_TIME_MS = 5 * 60 * 1000; // 5 minutes
// Safety bridge time used as a buffer to ensure price data remains valid for transactions by accounting for possible delays.
export const SAFETY_BRIDGE_PRICE_TIME_MS = 2 * 60 * 1000; // 2 minutes
// Minimum time that must elapse between consecutive price refreshes from the oracle to prevent abuse.
export const MIN_TIME_BETWEEN_REFRESHES_MS = 2.5 * 60 * 1000; // 1 minute

// Defines the maximum age a price can be for it to be considered valid for usage.
// This is the valid oracle time minus the safety bridge time.
export const MAX_PRICE_AGE_FOR_USE_MS = VALID_ORACLE_PRICE_TIME_MS - SAFETY_BRIDGE_PRICE_TIME_MS;
// Defines the minimum age a price must reach before a refresh is allowed.
// This helps to manage the frequency of updates and reduces unnecessary calls to the oracle.
export const MIN_AGE_BEFORE_REFRESH_MS = MAX_PRICE_AGE_FOR_USE_MS - MIN_TIME_BETWEEN_REFRESHES_MS;
// Sets a longer validity period for using an approximated price, useful for less sensitive or non-critical updates.
export const MAX_PRICE_AGE_FOR_APROXIMATED_USE_MS = 30 * 60 * 1000; // 30 minutes

//------------------------------------------
// JOBS

export const JOB_MAX_TIME_WAITING_TO_COMPLETE_MS = 10 * 60 * 1000; // 10 minute
export const JOB_TIME_WAITING_TO_TRY_AGAIN_MS = 200; // 1 second

export const JOB_MONITOR_INTERVAL_MS = 2 * 1000; // = 2 segundos

//------------------------------------------
// DB CONCURRENCY

export const DB_SERVERSELECCION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutos
export const DB_WRITE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

export const DB_LOCK_MAX_TIME_WAITING_TO_COMPLETE_MS = 10 * 60 * 1000; // 5 minute
export const DB_LOCK_TIME_WAITING_TO_TRY_AGAIN_MS = 200; // 1 second

export const DB_USE_TRANSACTIONS = process.env.DB_USE_TRANSACTIONS === 'true' ? true : false;

//------------------------------------------
// SERVER TIME

// si pasaron mas de SYNC_SERVER_TIME_ALWAYS refresca siempre
// si pasaron mas de SYNC_SERVER_TIME_OPTIONAL minutos refresca si refresh es true

export const SYNC_SERVER_TIME_ALWAYS_MS = 10 * 60 * 1000; // 10 minute
export const SYNC_SERVER_TIME_OPTIONAL_MS = 2 * 60 * 1000; // 2 minute

//----------------------------------------------------------------------
// LISTING

export const ITEMS_PER_PAGE = 5; // Set the number of items per page

//----------------------------------------------------------------------
// TOKENS

export const TOKEN_ADA_DECIMALS: Decimals = 6;
export const TOKEN_DEFAULT_DECIMALS: Decimals = 6;

export const TOKEN_ADA_MULTIPLIER = 1000000;

export const TOKEN_ADA_SYMBOL = isTestnet ? 't₳' : '₳';
export const TOKEN_ADA_TICKER = isTestnet ? 'tADA' : 'ADA';
export const TOKEN_LOVELACE_TICKER = 'lovelace';

export const PRICEx1e6 = 1_000_000;

export const PRICEx1e6_DECIMALS: Decimals = 6;
export const BPx1e2_DECIMALS: Decimals = 4; // BP es 1e2 + 1e2 es 1e4
export const BPx1e3_DECIMALS: Decimals = 5; // BP es 1e2 + 1e3 es 1e5

//----------------------------------------------------------------------
//TX STATUS

export const TRANSACTION_STATUS_CREATED = 'created'; // recien creada, no tiene hash // NOTE: este se usaria cuando epenas inicia el backend de crear tx, y quiero reservar ya de una unas utxos... pero se puede evitar usar y crear la tx al final del metodo como pending
export const TRANSACTION_STATUS_PENDING = 'pending'; // recien creada y en espera de ser firmada. Tiene hash.
export const TRANSACTION_STATUS_CANCELED = 'user-canceled';
export const TRANSACTION_STATUS_PENDING_TIMEOUT = 'pending-timeout'; // cuando pasa tiempo desde pending y no es firmada y enviada
export const TRANSACTION_STATUS_SUBMITTED = 'submitted'; // cuando una pending es firmada y enviada
export const TRANSACTION_STATUS_CONFIRMED = 'confirmed'; // cuando una submitted es confirmada
export const TRANSACTION_STATUS_FAILED = 'failed'; // cuando hay algun error, luego de ser creada, puede ser al firmar o enviar
export const TRANSACTION_STATUS_TIMEOUT = 'timeout'; // cuando es submitted pero no se confirma en la red
// export const TRANSACTION_STATUS_EXPIRED = 'expired';
// export const TRANSACTION_STATUS_UNKNOWN = 'unknown';
export const TRANSACTION_STATUS_PARSE_ERROR = 'parseError';

export type TransactionStatus =
    | typeof TRANSACTION_STATUS_CREATED
    | typeof TRANSACTION_STATUS_PENDING
    | typeof TRANSACTION_STATUS_CANCELED
    | typeof TRANSACTION_STATUS_PENDING_TIMEOUT
    | typeof TRANSACTION_STATUS_SUBMITTED
    | typeof TRANSACTION_STATUS_CONFIRMED
    | typeof TRANSACTION_STATUS_FAILED
    | typeof TRANSACTION_STATUS_TIMEOUT
    | typeof TRANSACTION_STATUS_PARSE_ERROR;
// | typeof TRANSACTION_STATUS_EXPIRED
// | typeof TRANSACTION_STATUS_UNKNOWN;

//-------------------------------------------------------------
