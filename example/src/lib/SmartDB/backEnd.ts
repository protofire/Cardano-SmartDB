
import { EndpointsManager, initBackEnd as initBackEndSmartDB } from 'smart-db/backEnd';
export * from 'smart-db/backEnd';
export * from './BackEnd/index';
export * from './Entities/index.BackEnd';

// NOTE: It is very important that this file is used to import from all API endpoints
// so that all necessary decorators of all classes are generated.

export function initBackEnd() {
    initBackEndSmartDB();
    const endpointsManager = EndpointsManager.getInstance();
    // Set the public endpoints that will be exposed on the internet using the regular expression
    // NOTE: Uncomment the following line to enable the endpoint for testing purposes, also related with npm run test-api
    // endpointsManager.setPublicEndPointsInternet([/^\/api\/test\/?.*/]);
    endpointsManager.setPublicEndPointsInternet([/^\/api\/free\/?.*/]);
    endpointsManager.setPublicEndPointsInternet([/^\/api\/blockfrost\/.+/]);
    endpointsManager.setPublicEndPointsInternet([/^\/api\/transactions\/.+/]);
}
