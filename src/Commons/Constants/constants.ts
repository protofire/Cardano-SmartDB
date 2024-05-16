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
export const isTestnet = process.env.NEXT_PUBLIC_CARDANO_NET === 'Emulator' || process.env.NEXT_PUBLIC_CARDANO_NET === 'Preview' || process.env.NEXT_PUBLIC_CARDANO_NET === 'Preprod' || process.env.NEXT_PUBLIC_CARDANO_NET === 'Custom';
export const isMainnet = process.env.NEXT_PUBLIC_CARDANO_NET === 'Mainnet' 

//----------------------------------------------------------------------

export const ADA_TX_FEE_MARGIN = 10_000_000n

//for creating a valid time range tx
export const VALID_TX_TIME_RANGE = 5 * 60 * 1000; // = 5 minutos
// export const ValidTimeRangeInSlots = 15 * 60  // = 15 minutos

export const TX_CHECK_INTERVAL = 5 * 1000; // = 5 segundos
export const TX_PREPARING_TIME = 10 * 60 * 1000; // = 2 minutos
export const TX_CONSUMING_TIME = 6 * 60 * 1000; // = 15 minutos
export const TX_TIMEOUT = 30 * 60 * 1000; // = 15 minutos


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
export const SYNC_SERVER_TIME_10M_MS = 10 * 60 * 1000; // 10 minute
export const SYNC_SERVER_TIME_2M_MS = 2 * 60 * 1000; // 2 minute

//------------------------------------------

export const TIME_OUT_TRY_TX = 6000; // = 6 segundos
export const TIME_OUT_TRY_UPDATESTAKINGPOOL = 5000; // = 4 segundos
export const TIME_SAFETY_AFTER_TX = 5000; // = 5 segundos
export const TIME_WAIT_DEPLOY = 4000; // = 4 segundos

//------------------------------------------

export const MAX_TX_EX_MEM = 14_000_000;
export const MAX_TX_EX_STEPS = 10_000_000_000;
export const MMAX_TX_SIZE = 16_384;

//----------------------------------------------------------------------
export const API_TIMEOUT = 1 * 10 * 1000; // = 10 segundos
//----------------------------------------------------------------------



export const ADA_DECIMALS = 6;
export const ADA_UI = isTestnet ? 't₳' : '₳';
export const ADA_UI_LETTERS = isTestnet ? 'tADA' : 'ADA';
export const LOVELACE_UI = 'lovelace';

//----------------------------------------------------------------------

export const ITEMS_PER_PAGE = 5; // Set the number of items per page

//----------------------------------------------------------------------
// "pending" | "submitted" | "confirmed" | "failed" | "expired" | "unknown";

export const TRANSACTION_STATUS_PENDING = 'pending';
export const TRANSACTION_STATUS_CANCELED = 'canceled';
export const TRANSACTION_STATUS_SUBMITTED = 'submitted';
export const TRANSACTION_STATUS_CONFIRMED = 'confirmed';
export const TRANSACTION_STATUS_FAILED = 'failed';
export const TRANSACTION_STATUS_TIMEOUT = 'timeout';
export const TRANSACTION_STATUS_EXPIRED = 'expired';
export const TRANSACTION_STATUS_UNKNOWN = 'unknown';

//-------------------------------------------------------------

export const WALLET_CREATEDBY_ADMIN = 'Admin';
export const WALLET_CREATEDBY_LOGIN = 'Login';

//-------------------------------------------------------------

export const BLOCKFROST_URL_EPOCHS_LATEST_PARAMETERS = '/epochs/latest/parameters';

//-------------------------------------------------------------
