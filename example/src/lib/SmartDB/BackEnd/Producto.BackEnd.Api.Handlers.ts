import {
    BackEndApiHandlersFor,
    BackEndAppliedFor,
    BaseBackEndApiHandlers,
    BaseBackEndApplied,
    BaseBackEndMethods
} from 'smart-db/backEnd';
import { ProductoEntity } from '../Entities/Producto.Entity';

@BackEndAppliedFor(ProductoEntity)
export class ProductoBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = ProductoEntity;
    protected static _BackEndMethods = BaseBackEndMethods;
}

@BackEndApiHandlersFor(ProductoEntity)
export class ProductoApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = ProductoEntity;
    protected static _BackEndApplied = ProductoBackEndApplied;
}

