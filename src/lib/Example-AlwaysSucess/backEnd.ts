


export * from '@/src/lib/SmartDB/backEnd'

export * from './BackEnd/index'
export * from './Entities/Dummy.Entity.Mongo'
// TODO: es muy importante que este archivo sea usado para importar desde todos los endpoints api
// por que asi se generan todos los decoratos necesarios de todas las clases
export function initAllDecoratorsExample (){};