import {
    BackEndApiHandlersFor,
    BackEndAppliedFor,
    BaseBackEndApiHandlers,
    BaseBackEndApplied,
    BaseBackEndMethods
} from 'smart-db/backEnd';
import { UserOptEntity } from '../Entities';

@BackEndAppliedFor(UserOptEntity)
export class UserOptBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = UserOptEntity;
    protected static _BackEndMethods = BaseBackEndMethods;
}

@BackEndApiHandlersFor(UserOptEntity)
export class UserOptApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = UserOptEntity;
    protected static _BackEndApplied = UserOptBackEndApplied;
}
