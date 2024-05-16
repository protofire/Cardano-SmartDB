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
    /^\/api\/fundholdings\/by-CS/,

    /^\/api\/funds(-with-details)?\/is-admin/,
    /^\/api\/funds(-with-details)?\/FT_PriceADAx1e6-by-FundPolicy_CS/,
    /^\/api\/funds(-with-details)?\/total_FT_Minted-by-FundPolicy_CS/,
    /^\/api\/funds(-with-details)?\/TVLx1e6-by-FundPolicy_CS/,

    /^\/api\/investunits(-with-details)?\/by-CS/,
    /^\/api\/prices\/(priceADAx1e6-by-Token|priceADAx1e6-by-TokenFT)/,
    /^\/api\/prices-historic\/historic-priceADAx1e6-by-Token/,
    /^\/api\/protocols\/is-admin/,
    // /^\/api\/scripts\/by-hash/,
    /^\/api\/site-settings\/create-init/,
    /^\/api\/smartutxos(-with-details)?\/(by-address|by-txhash|update)/,
    /^\/api\/time/,
    /^\/api\/token-metadata\/metadata-by-Token/,
    /^\/api\/transactions\/(update|update-failed-transaction|begin-status-updater|submit-and-begin-status-updater|get-status)/,
    /^\/api\/wallets\/is-core-team/,
];

// let publicEndpointsLocal = new Set(PUBLIC_ENDPOINTS_FOR_LOCAL_REFERER);

// export function getPublicEndpointsLocal():RegExp[] {
//     const res :RegExp[] = Array.from(publicEndpointsLocal);
//     return res
// }

// export function setPublicEndpointsLocal(endpoints: RegExp[] , options = { merge: true }) {
//     if (options.merge) {
//         publicEndpointsLocal = new Set([...publicEndpointsLocal, ...endpoints]);
//     } else {
//         publicEndpointsLocal = new Set(endpoints);
//     }
// }


// export let PUBLIC_ENDPOINTS_FROM_INTERNET: RegExp[] = [
export const PUBLIC_ENDPOINTS_FROM_INTERNET:RegExp[]  = [
    /^\/api\/prices\/(priceADAx1e6-by-Token|priceADAx1e6-by-TokenFT)/,
    /^\/api\/prices-historic\/historic-priceADAx1e6-by-Token/,
    /^\/api\/token-metadata\/metadata-by-Token/,
];

// let publicEndpointsInternet= new Set(PUBLIC_ENDPOINTS_FROM_INTERNET);

// export function getPublicEndpointsInternet() : RegExp[]{
//     const res :RegExp[] = Array.from(publicEndpointsInternet);
//     return res;
// }

// export function setPublicEndpointsInternet(endpoints: RegExp[] , options = { merge: true }) {
//     if (options.merge) {
//         publicEndpointsInternet = new Set([...publicEndpointsInternet, ...endpoints]);
//     } else {
//         publicEndpointsInternet = new Set(endpoints);
//     }
// }
