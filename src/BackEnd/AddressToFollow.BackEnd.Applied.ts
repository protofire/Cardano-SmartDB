import { CS, OptionsGet, isFrontEndEnvironment, isNullOrBlank } from '../Commons/index.js';
import { BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import { console_log, tabs } from '../Commons/BackEnd/globalLogs.js';
import { AddressToFollowEntity } from '../Entities/AddressToFollow.Entity.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';

//BackEnd Methods de cada clase llevan seteado la entidad

@BackEndAppliedFor(AddressToFollowEntity)
export class AddressToFollowBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = AddressToFollowEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    public static async getByAddress<T extends AddressToFollowEntity>(address: string, CS: CS,  optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]> {
        if (isNullOrBlank(address)) {
            throw `Address not defined`;
        }
        if (isNullOrBlank(CS)) {
            throw `Currency Symbol not defined`;
        }
        if (isFrontEndEnvironment()) {
            //return await this.getByAddressApi(address, optionsGet);
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `getByAddress - Init`);
        //----------------------------
        const addressesToFollow: T[] = await this._BackEndMethods.getByParams<T>(this._Entity, { address, CS }, optionsGet, restricFilter);
        //-------------------------
        console_log(-1, this._Entity.className(), `getByAddress - OK`);
        //-------------------------
        return addressesToFollow;
    }

    // #endregion class methods
}
