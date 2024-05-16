
export * from './BackEnd/index.js';
export * from './Commons/index.BackEnd.js';
export * from './Entities/index.BackEnd.js';
export * from './lib/backEnd.js';

// TODO: es muy importante que este archivo sea usado para importar desde todos los endpoints api
// por que asi se generan todos los decoratos necesarios de todas las clases
export function initAllDecorators (){};