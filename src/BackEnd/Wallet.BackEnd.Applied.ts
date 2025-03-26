import { PaymentKeyHash } from '@lucid-evolution/lucid';
import { console_log } from '../Commons/BackEnd/globalLogs.js';
import { BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import { isFrontEndEnvironment, isNullOrBlank } from '../Commons/utils.js';
import { WalletEntity } from '../Entities/Wallet.Entity.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';

@BackEndAppliedFor(WalletEntity)
export class WalletBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = WalletEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    public static async isCoreTeam(pkh: PaymentKeyHash, restricFilter?: Record<string, any>): Promise<boolean> {
        //-------------------------
        if (isNullOrBlank(pkh)) {
            throw `pkh not defined`;
        }
        //-------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `isCoreTeam - Init`);
        //----------------------------
        const isCoreTeam = await this.checkIfExists_({ paymentPKH: pkh, isCoreTeam: true });
        //-------------------------
        console_log(-1, this._Entity.className(), `isCoreTeam - ${isCoreTeam} - OK`);
        //-------------------------
        return isCoreTeam;
    }

    // #endregion class methods
}
