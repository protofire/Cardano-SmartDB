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

export const VALID_PRICE_TIME_MS = 2 * 60 * 1000; // 2 minute
export const VALID_APROXIMATED_PRICE_TIME_MS = 30 * 60 * 1000; // 5 minute

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
