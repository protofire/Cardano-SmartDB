import { OptionsGet, OptionsGetOne } from '../Commons';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods';
import { isNullOrBlank, isFrontEndEnvironment } from '@/src/utils/commons/utils';
import { console_log, tabs } from '../Commons/BackEnd/globalLogs';
import { SmartUTxOEntity } from '../Entities/SmartUTxO.Entity';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied';
import { BackEndAppliedFor } from '../Commons/Decorator.BackEndAppliedFor';

@BackEndAppliedFor(SmartUTxOEntity)
export class SmartUTxOBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = SmartUTxOEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    public static async getByAddress<T extends SmartUTxOEntity>(address: string, optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]> {
        if (isNullOrBlank(address)) {
            throw `address not defined`;
        }
        if (isFrontEndEnvironment()) {
            // return await this.getByAddressApi<T>(address, optionsGet);
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `getByAddress  - Init`);
        //----------------------------
        const smartUTxOs: T[] = await this.getByParams_<T>({ address }, optionsGet, restricFilter);
        return smartUTxOs;
    }

    public static async getByTxHashAndOutputIndex<T extends SmartUTxOEntity>(
        txHash: string,
        outputIndex: number,
        optionsGet?: OptionsGetOne,
        restricFilter?: Record<string, any>
    ): Promise<T | undefined> {
        if (txHash === undefined || txHash === '' || outputIndex === undefined || outputIndex < 0) {
            throw `txHash or outputIndex not defined`;
        }
        if (isFrontEndEnvironment()) {
            //return await this.getByTxHashAndOutputIndexApi<T>(txHash, outputIndex, optionsGet);
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `getByTxHashAndOutputIndex  - Init`);
        //----------------------------
        const smartUTxO = await this.getOneByParams_<T>({ txHash, outputIndex }, optionsGet, restricFilter);
        return smartUTxO;
    }

    // #endregion class methods
}


