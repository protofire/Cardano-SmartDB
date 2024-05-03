
export * from './BackEnd/index';
export * from './Commons/index.BackEnd';
export * from './Entities/index.BackEnd';
export * from './lib/backEnd';

// TODO: es muy importante que este archivo sea usado para importar desde todos los endpoints api
// por que asi se generan todos los decoratos necesarios de todas las clases
export function initAllDecorators (){};