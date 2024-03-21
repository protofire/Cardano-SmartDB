import { SmartUTxOWithDetailsEntity } from '../Entities/SmartUTxO.WithDetails.Entity';
import { SmartUTxOBackEndApiHandlers } from './SmartUTxO.BackEnd.Api.Handlers';
import { SmartUTxOWithDetailsBackEndApplied } from './SmartUTxO.WithDetails.BackEnd.Applied';

export class SmartUTxOWithDetailsBackEndApiHandlers extends SmartUTxOBackEndApiHandlers {
    protected static _Entity = SmartUTxOWithDetailsEntity;
    protected static _BackEndApplied = SmartUTxOWithDetailsBackEndApplied;
    // protected static _BackEndMethods = this._BackEndApplied.getBack();
}


