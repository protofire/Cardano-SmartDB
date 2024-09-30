export * from './endpoints.js';
export * from './wallets.js';
export * from './images.js';

//----------------------------------------------------------------------

export const VALID_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const VALID_SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60;
export const VALID_SESSION_DURATION_STR = '30d'; // 30 days

//----------------------------------------------------------------------

export const LUCID_NETWORK_MAINNET_INT = 1;
export const LUCID_NETWORK_TESTNET_INT = 0;

export const LucidLUCID_NETWORK_MAINNET_NAME = 'Mainnet';
export const LucidLUCID_NETWORK_PREVIEW_NAME = 'Preview';
export const LucidLUCID_NETWORK_PREPROD_NAME = 'Preprod';
export const LucidLUCID_NETWORK_CUSTOM_NAME = 'Custom';

//----------------------------------------------------------------------

export const isEmulator = process.env.NEXT_PUBLIC_CARDANO_NET === 'Emulator';
export const isTestnet =
    process.env.NEXT_PUBLIC_CARDANO_NET === 'Emulator' ||
    process.env.NEXT_PUBLIC_CARDANO_NET === 'Preview' ||
    process.env.NEXT_PUBLIC_CARDANO_NET === 'Preprod' ||
    process.env.NEXT_PUBLIC_CARDANO_NET === 'Custom';
export const isMainnet = process.env.NEXT_PUBLIC_CARDANO_NET === 'Mainnet';

//----------------------------------------------------------------------

export const API_TIMEOUT = 1 * 10 * 1000; // = 10 segundos
export const API_TRY_AGAIN = 1 * 1000; // = 1 segundos

export const WAIT_FOR_WALLET_ENABLING = 1 * 4 * 1000; // = 4 segundos
export const WAIT_FOR_WALLET_EXTENSIONS = 1 * 1000; // = 1 segundos
export const WAIT_FOR_WALLET_ACTIVATION = 1 * 1000; // = 1 segundos

//----------------------------------------------------------------------

export const MONITOR_JOB_INTERVAL = 1 * 1000; // = 1 segundos

//----------------------------------------------------------------------

export const TIMEOUT_PROXY_BLOCKFROST = 25000; // = 25 segundos

//----------------------------------------------------------------------

//for creating a valid time range tx
export const VALID_TX_TIME_RANGE = 5 * 60 * 1000; // = 5 minutos
export const TX_TIME_RANGE_MARGIN = 1 * 60 * 1000; // = 1 minutos
// export const ValidTimeRangeInSlots = 15 * 60  // = 15 minutos

export const TX_CHECK_INTERVAL = 5 * 1000; // = 5 segundos

export const TX_PREPARING_TIME = 3 * 60 * 1000; // = 10 minutos
export const TX_CONSUMING_TIME = 6 * 60 * 1000; // = 6 minutos
export const TX_TIMEOUT = 20 * 60 * 1000; // = 20 minutos

export const TX_WAIT_FOR_SYNC = 5 * 1000; // = 5 segundos

//----------------------------------------------------------------------

// smart contract
// oracleData_Valid_Time = 300,000 (5 * 60 * 1000 = 5 minutes)
// This is the real time that the oracle data is valid in the smart contract.
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

// si pasaron mas de SYNC_SERVER_TIME_ALWAYS refresca siempre
// si pasaron mas de SYNC_SERVER_TIME_OPTIONAL minutos refresca si refresh es true

export const SYNC_SERVER_TIME_ALWAYS = 10 * 60 * 1000; // 10 minute
export const SYNC_SERVER_TIME_OPTIONAL = 2 * 60 * 1000; // 2 minute

//------------------------------------------

export const MAX_TX_EX_MEM = 14_000_000;
export const MAX_TX_EX_STEPS = 10_000_000_000;
export const MMAX_TX_SIZE = 16_384;

//----------------------------------------------------------------------

export const ADA_TX_FEE_MARGIN = 10_000_000n;

//----------------------------------------------------------------------

export const ADA_DECIMALS = 6;
export const ADA_UI = isTestnet ? 't₳' : '₳';
export const ADA_UI_LETTERS = isTestnet ? 'tADA' : 'ADA';
export const LOVELACE_UI = 'lovelace';

//----------------------------------------------------------------------

export const ITEMS_PER_PAGE = 5; // Set the number of items per page

//----------------------------------------------------------------------

export const TRANSACTION_STATUS_CREATED = 'created'; // recien creada y sirve para reservar utxos. No tiene hash.
export const TRANSACTION_STATUS_PENDING = 'pending'; // recien creada y en espera de ser firmada. Tiene hash.
export const TRANSACTION_STATUS_PENDING_TIMEOUT = 'pending-timeout'; // cuando pasa tiempo desde pending y no es firmada y enviada
export const TRANSACTION_STATUS_USER_CANCELED = 'user-canceled'; // cuando es pending pero el usuario la cancela. No lo estoy usando por ahora.,
export const TRANSACTION_STATUS_SUBMITTED = 'submitted'; // cuando una pending es firmada y enviada
export const TRANSACTION_STATUS_CONFIRMED = 'confirmed'; // cuando una submitted es confirmada
export const TRANSACTION_STATUS_FAILED = 'failed'; // cuando hay algun error, luego de ser creada, puede ser al firmar o enviar
export const TRANSACTION_STATUS_TIMEOUT = 'timeout'; // cuando es submitted pero no se confirma en la red
// export const TRANSACTION_STATUS_EXPIRED = 'expired';
// export const TRANSACTION_STATUS_UNKNOWN = 'unknown';

export type TransactionStatus =
    | typeof TRANSACTION_STATUS_CREATED
    | typeof TRANSACTION_STATUS_PENDING
    | typeof TRANSACTION_STATUS_PENDING_TIMEOUT
    | typeof TRANSACTION_STATUS_USER_CANCELED
    | typeof TRANSACTION_STATUS_SUBMITTED
    | typeof TRANSACTION_STATUS_CONFIRMED
    | typeof TRANSACTION_STATUS_FAILED
    | typeof TRANSACTION_STATUS_TIMEOUT;
// | typeof TRANSACTION_STATUS_EXPIRED
// | typeof TRANSACTION_STATUS_UNKNOWN;

//-------------------------------------------------------------

export const WALLET_CREATEDBY_ADMIN = 'Admin';
export const WALLET_CREATEDBY_LOGIN = 'Login';

//-------------------------------------------------------------

export const BLOCKFROST_URL_EPOCHS_LATEST_PARAMETERS = '/epochs/latest/parameters';

//-------------------------------------------------------------
