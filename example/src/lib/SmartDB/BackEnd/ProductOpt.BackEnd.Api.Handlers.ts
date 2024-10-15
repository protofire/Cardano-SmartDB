import {
    BackEndApiHandlersFor,
    BackEndAppliedFor,
    BaseBackEndApiHandlers,
    BaseBackEndApplied,
    BaseBackEndMethods
} from 'smart-db/backEnd';
import { ProductOptEntity } from '../Entities';

@BackEndAppliedFor(ProductOptEntity)
export class ProductOptBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = ProductOptEntity;
    protected static _BackEndMethods = BaseBackEndMethods;
}

@BackEndApiHandlersFor(ProductOptEntity)
export class ProductOptApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = ProductOptEntity;
    protected static _BackEndApplied = ProductOptBackEndApplied;
}
