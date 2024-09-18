import {
    BackEndApiHandlersFor,
    BackEndAppliedFor,
    BaseBackEndApiHandlers,
    BaseBackEndApplied,
    BaseBackEndMethods
} from 'smart-db/backEnd';
import { ProductEntity } from '../Entities/Product.Entity';

@BackEndAppliedFor(ProductEntity)
export class ProductBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = ProductEntity;
    protected static _BackEndMethods = BaseBackEndMethods;
}

@BackEndApiHandlersFor(ProductEntity)
export class ProductApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = ProductEntity;
    protected static _BackEndApplied = ProductBackEndApplied;
}

