import { EndpointsManager, initAllDecorators } from 'smart-db/backEnd';
export * from 'smart-db/backEnd';
export * from './BackEnd/index';
export * from './Entities/index.BackEnd';
// TODO: es muy importante que este archivo sea usado para importar desde todos los endpoints api
// por que asi se generan todos los decoratos necesarios de todas las clases

export function initAllDecoratorsExample() {
    const endpointsManager = EndpointsManager.getInstance();
    initAllDecorators ();
    
    endpointsManager.setPublicEndPointsInternet([/^\/api\/blockfrost\/.+/]);
    
    console.log('initAllDecoratorsExample');
}
