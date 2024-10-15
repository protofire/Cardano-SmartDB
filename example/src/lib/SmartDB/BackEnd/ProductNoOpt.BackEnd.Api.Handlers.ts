import {
    BackEndApiHandlersFor,
    BackEndAppliedFor,
    BaseBackEndApiHandlers,
    BaseBackEndApplied,
    BaseBackEndMethods
} from 'smart-db/backEnd';
import { ProductNoOptEntity } from '../Entities';

@BackEndAppliedFor(ProductNoOptEntity)
export class ProductNoOptBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = ProductNoOptEntity;
    protected static _BackEndMethods = BaseBackEndMethods;
}

@BackEndApiHandlersFor(ProductNoOptEntity)
export class ProductNoOptApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = ProductNoOptEntity;
    protected static _BackEndApplied = ProductNoOptBackEndApplied;
}
