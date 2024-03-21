import { isFrontEndEnvironment, isNullOrBlank } from '@/src/utils/commons/utils';
import { OptionsGet } from '../Commons';
import { BackEndAppliedFor } from '../Commons/Decorator.BackEndAppliedFor';
import { console_log, tabs } from '../Commons/BackEnd/globalLogs';
import { AddressToFollowEntity } from '../Entities/AddressToFollow.Entity';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods';

//BackEnd Methods de cada clase llevan seteado la entidad

@BackEndAppliedFor(AddressToFollowEntity)
export class AddressToFollowBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = AddressToFollowEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    public static async getByAddress<T extends AddressToFollowEntity>(address: string, optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]> {
        if (isNullOrBlank(address)) {
            throw `address not defined`;
        }
        if (isFrontEndEnvironment()) {
            //return await this.getByAddressApi(address, optionsGet);
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `getByAddress - Init`);
        //----------------------------
        const addressesToFollow: T[] = await this._BackEndMethods.getByParams<T>(this._Entity, { address }, optionsGet, restricFilter);
        //-------------------------
        console_log(-1, this._Entity.className(), `getByAddress - OK`);
        //-------------------------
        return addressesToFollow;
    }

    // #endregion class methods
}
