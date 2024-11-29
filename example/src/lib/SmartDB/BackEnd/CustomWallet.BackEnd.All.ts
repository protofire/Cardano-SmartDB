import {
    BackEndApiHandlersFor,
    BackEndAppliedFor,
    BaseBackEndMethods,
    WalletBackEndApiHandlers,
    WalletBackEndApplied
} from 'smart-db/backEnd';
import { CustomWalletEntity } from '../Entities/CustomWallet.Entity';

@BackEndAppliedFor(CustomWalletEntity)
export class CustomWalletBackEndApplied extends WalletBackEndApplied {
    protected static _Entity = CustomWalletEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    // #endregion class methods
}

@BackEndApiHandlersFor(CustomWalletEntity)
export class CustomWalletBackEndApiHandlers extends WalletBackEndApiHandlers {
    protected static _Entity = CustomWalletEntity;
    protected static _BackEndApplied = CustomWalletBackEndApplied;
    // protected static _BackEndMethods = this._BackEndApplied.getBack();

    // #region custom api handlers

    // #endregion custom api handlers

    // #region api handlers

    // #endregion api handlers
}
