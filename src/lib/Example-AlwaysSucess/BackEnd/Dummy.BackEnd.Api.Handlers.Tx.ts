import { BackEndAppliedFor } from '../../SmartDB';
import { BaseSmartDBBackEndApiHandlers, BaseSmartDBBackEndApplied, BaseSmartDBBackEndMethods } from '../../SmartDB/BackEnd';
import { DummyEntity } from '../Entities/Dummy.Entity';

@BackEndAppliedFor(DummyEntity)
export class DummyBackEndApplied extends BaseSmartDBBackEndApplied {
    protected static _Entity = DummyEntity;
    protected static _BackEndMethods = BaseSmartDBBackEndMethods;
}

export class DummyTxApiHandlers extends BaseSmartDBBackEndApiHandlers {
    protected static _Entity = DummyEntity;
    protected static _BackEndApplied = DummyBackEndApplied;
}
