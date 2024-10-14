import {
    BackEndApiHandlersFor,
    BackEndAppliedFor,
    BaseBackEndApiHandlers,
    BaseBackEndApplied,
    BaseBackEndMethods
} from 'smart-db/backEnd';
import { UserNoOptEntity } from '../Entities';

@BackEndAppliedFor(UserNoOptEntity)
export class UserNoOptBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = UserNoOptEntity;
    protected static _BackEndMethods = BaseBackEndMethods;
}

@BackEndApiHandlersFor(UserNoOptEntity)
export class UserNoOptApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = UserNoOptEntity;
    protected static _BackEndApplied = UserNoOptBackEndApplied;
}
