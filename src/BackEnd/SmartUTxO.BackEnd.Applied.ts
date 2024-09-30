import { console_log } from '../Commons/BackEnd/globalLogs.js';
import { BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import { CascadeUpdate, OptionsGet, OptionsGetOne, isFrontEndEnvironment, isNullOrBlank, toJson } from '../Commons/index.js';
import { BaseEntity } from '../Entities/Base/Base.Entity.js';
import { SmartUTxOEntity } from '../Entities/SmartUTxO.Entity.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';

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

    public static async isAvailableForReading<T extends SmartUTxOEntity>(smartUTxO: T): Promise<boolean> {
        //----------------------------
        const TransactionBackEndApplied = (await import('./Transaction.BackEnd.Applied.js')).TransactionBackEndApplied;
        //----------------------------
        const outRef = smartUTxO.getOutRef();
        const isFree = await TransactionBackEndApplied.isOutRefFreeForReading(outRef);
        //----------------------------
        return isFree;
    }

    public static async isAvailableForConsuming<T extends SmartUTxOEntity>(smartUTxO: T): Promise<boolean> {
        //----------------------------
        const TransactionBackEndApplied = (await import('./Transaction.BackEnd.Applied.js')).TransactionBackEndApplied;
        //----------------------------
        const outRef = smartUTxO.getOutRef();
        const isFree = await TransactionBackEndApplied.isOutRefFreeForConsuming(outRef);
        //----------------------------
        return isFree;
    }

    public static async getAvailablesForReading<T extends SmartUTxOEntity>(smartUTxOs: T[]): Promise<T[]> {
        //----------------------------
        const TransactionBackEndApplied = (await import('./Transaction.BackEnd.Applied.js')).TransactionBackEndApplied;
        //----------------------------
        const freesmartUTxOs: T[] = [];
        for (const smartUTxO of smartUTxOs) {
            const outRef = smartUTxO.getOutRef();
            const isFree = await TransactionBackEndApplied.isOutRefFreeForReading(outRef);
            if (isFree) {
                freesmartUTxOs.push(smartUTxO);
            }
        }
        return freesmartUTxOs;
    }

    public static async getAvailablesForConsuming<T extends SmartUTxOEntity>(smartUTxOs: T[]): Promise<T[]> {
        //----------------------------
        const TransactionBackEndApplied = (await import('./Transaction.BackEnd.Applied.js')).TransactionBackEndApplied;
        //----------------------------
        const freesmartUTxOs: T[] = [];
        for (const smartUTxO of smartUTxOs) {
            const outRef = smartUTxO.getOutRef();
            const isFree = await TransactionBackEndApplied.isOutRefFreeForConsuming(outRef);
            if (isFree) {
                freesmartUTxOs.push(smartUTxO);
            }
        }
        return freesmartUTxOs;
    }

    // #endregion class methods

    // #region callbacks

    public static async callbackOnAfterLoad<T extends BaseEntity>(instance: T, cascadeUpdate: CascadeUpdate): Promise<CascadeUpdate> {
        //--------------------------------------
        console_log(1, this._Entity.className(), `callbackOnAfterLoad - Init`);
        //--------------------------------------
        cascadeUpdate = await super.callbackOnAfterLoad(instance, cascadeUpdate);
        //--------------------------------------
        if (cascadeUpdate.swUpdate) {
            console_log(0, instance.className(), `callbackOnAfterLoad - updating because super.callbackOnAfterLoad...`);
        }
        //--------------------------------------
        const smartUTxOInstance = instance as unknown as SmartUTxOEntity;
        //-------------------
        // Call to get the 4 dates using outRef
        const outRefToSearch = smartUTxOInstance.getOutRef(); // Assuming you have an outRef to use for the search
        //----------------------------
        const TransactionBackEndApplied = (await import('./Transaction.BackEnd.Applied.js')).TransactionBackEndApplied;
        //----------------------------
        const { isPreparingForReading, isReading, isPreparingForConsuming, isConsuming } = await TransactionBackEndApplied.getReadingAndConsumingDates(outRefToSearch);
        //--------------------------------------
        const prev = {
            isPreparingForReading: smartUTxOInstance.isPreparingForReading,
            isReading: smartUTxOInstance.isReading,
            isPreparingForConsuming: smartUTxOInstance.isPreparingForConsuming,
            isConsuming: smartUTxOInstance.isConsuming,
        };
        //--------------------------------------
        // Update the new values
        smartUTxOInstance.isPreparingForReading = isPreparingForReading;
        smartUTxOInstance.isReading = isReading;
        smartUTxOInstance.isPreparingForConsuming = isPreparingForConsuming;
        smartUTxOInstance.isConsuming = isConsuming;
        //--------------------------------------
        const current = {
            isPreparingForReading: smartUTxOInstance.isPreparingForReading,
            isReading: smartUTxOInstance.isReading,
            isPreparingForConsuming: smartUTxOInstance.isPreparingForConsuming,
            isConsuming: smartUTxOInstance.isConsuming,
        };
        //--------------------------------------
        let updatedFields: Record<string, { from: any; to: any }> = {};
        let swUpdateValues = false;
        //--------------------------------------
        Object.entries(prev).forEach(([key, value]) => {
            // Check if the value is a Date object
            if (value instanceof Date && current[key as keyof typeof current] instanceof Date) {
                if (value.getTime() !== current[key as keyof typeof current]?.getTime()) {
                    updatedFields[key] = {
                        from: value,
                        to: current[key as keyof typeof current],
                    };
                    swUpdateValues = true;
                }
            } else if (value !== current[key as keyof typeof current]) {
                // Non-date values can be compared as usual
                updatedFields[key] = {
                    from: value,
                    to: current[key as keyof typeof current],
                };
                swUpdateValues = true;
            }
        });
        //--------------------------------------
        if (swUpdateValues) {
            console_log(0, instance.className(), `callbackOnAfterLoad - updating because updatedValues - which fields: ${toJson({ updatedFields })}`);
            cascadeUpdate = { swUpdate: true, updatedFields };
        }
        //--------------------------------------
        console_log(-1, this._Entity.className(), `callbackOnAfterLoad  - OK`);
        //-------------------------------------
        return cascadeUpdate;
    }

    // #endregion callbacks
}
