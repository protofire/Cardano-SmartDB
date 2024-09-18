import {
    BackEndApiHandlersFor,
    BackEndAppliedFor,
    BaseBackEndApiHandlers,
    BaseBackEndApplied,
    BaseBackEndMethods
} from 'smart-db/backEnd';
import { TestEntity } from '../Entities';

@BackEndAppliedFor(TestEntity)
export class TestBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = TestEntity;
    protected static _BackEndMethods = BaseBackEndMethods;
}

@BackEndApiHandlersFor(TestEntity)
export class TestApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = TestEntity;
    protected static _BackEndApplied = TestBackEndApplied;
}
