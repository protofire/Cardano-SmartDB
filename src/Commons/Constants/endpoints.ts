//TODO: deberia ser una tabla desde el admin esta info

// /PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER
export const PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER:RegExp[]  = [
    /^\/api\/[a-zA-Z-_]+\/[a-f0-9]+$/,
    /^\/api\/[a-zA-Z-_]+\/all/,
    /^\/api\/[a-zA-Z-_]+\/by-params/,
    /^\/api\/[a-zA-Z-_]+\/exists/,
    /^\/api\/[a-zA-Z-_]+\/count/,
    /^\/api\/[a-zA-Z-_]+\/deployed/,
    /^\/api\/[a-zA-Z-_]+\/loadRelationMany/,
    /^\/api\/[a-zA-Z-_]+\/loadRelationOne/,

    /^\/api\/[a-zA-Z-_]+\/tx/,

    /^\/api\/[a-zA-Z-_]+/,
    /^\/api\/[a-zA-Z-_]+\/create/,
    /^\/api\/[a-zA-Z-_]+\/sync/,

    /^\/api\/addressestofollow\/by-address/,
    /^\/api\/auth/,
    /^\/api\/blockfrost/,
    /^\/api\/emulators/,
    
    /^\/api\/prices\/(priceADAx1e6-by-Token|priceADAx1e6-by-TokenFT)/,
    /^\/api\/scripts\/by-hash/,
    /^\/api\/site-settings\/create-init/,
    /^\/api\/smartutxos(-with-details)?\/(by-address|by-txhash|update)/,
    /^\/api\/time/,
    /^\/api\/token-metadata\/metadata-by-Token/,
    /^\/api\/transactions\/(update|update-failed-transaction|begin-status-updater|submit-and-begin-status-updater|get-status)/,
    /^\/api\/wallets\/is-core-team/,
];

// export let PUBLIC_ENDPOINTS_FROM_INTERNET: RegExp[] = [
export const PUBLIC_ENDPOINTS_FROM_INTERNET:RegExp[]  = [
];
