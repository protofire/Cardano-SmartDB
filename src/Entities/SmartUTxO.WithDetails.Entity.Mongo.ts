import 'reflect-metadata';
import { MongoAppliedFor } from '../Commons/Decorators/Decorator.MongoAppliedFor.js';
import { SmartUTxOEntityMongo } from './SmartUTxO.Entity.Mongo.js';
import { SmartUTxOWithDetailsEntity } from './SmartUTxO.WithDetails.Entity.js';

@MongoAppliedFor([SmartUTxOWithDetailsEntity])
export class SmartUTxOWithDetailsEntityMongo extends SmartUTxOEntityMongo {
    protected static Entity = SmartUTxOWithDetailsEntity;
}
