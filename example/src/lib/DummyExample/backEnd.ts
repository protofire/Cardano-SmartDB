import { EndpointsManager, initBackEnd as initBackEndSmartDB } from 'smart-db/backEnd';
export * from 'smart-db/backEnd';
export * from './BackEnd/index';
export * from './Entities/index.BackEnd';

// TODO: es muy importante que este archivo sea usado para importar desde todos los endpoints api
// por que asi se generan todos los decoratos necesarios de todas las clases

export function initBackEnd() {
    initBackEndSmartDB ();
    const endpointsManager = EndpointsManager.getInstance();
    // endpointsManager.setPublicEndPointsInternet([/^\/api\/blockfrost\/.+/]);
}
