import { console_error, console_log } from '../Commons/BackEnd/globalLogs.js';
import { BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import { OptionsGet, OptionsGetOne, isFrontEndEnvironment, isNullOrBlank } from '../Commons/index.js';
import { SmartUTxOEntity } from '../Entities/SmartUTxO.Entity.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';
import { DatabaseService } from './DatabaseService/Database.Service.js';

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

    public static async releaseUTxO(txHash: string, outputIndex: number, swReleaseIsPreparing: boolean = true, swReleaseIsConsuming: boolean = true): Promise<void> {
        //----------------------------
        if (txHash === undefined || txHash === '' || outputIndex === undefined || outputIndex < 0) {
            throw `txHash or outputIndex not defined`;
        }
        if (isFrontEndEnvironment()) {
            //return await this.releaseUTxOsApi(txHash, outputIndex);
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        return await DatabaseService().withContextTransaction(`[${this._Entity.className()}] - releaseUTxO`, async () => {
            //-------------------------
            const smartUTxO: SmartUTxOEntity | undefined = await this.getOneByParams_({ txHash, outputIndex });
            //-------------------------
            if (smartUTxO === undefined) {
                console_error(0, this._Entity.className(), `releaseUTxO - smartUTxO not found for txHash: ${txHash} - outputIndex: ${outputIndex}`);
            } else {
                let updated = false;
                // Only modify if the flag is true AND the current value is not already undefined
                if (swReleaseIsPreparing === true && (smartUTxO.isPreparingForReading !== undefined || smartUTxO.isPreparingForConsuming !== undefined)) {
                    smartUTxO.isPreparingForReading = undefined;
                    smartUTxO.isPreparingForConsuming = undefined;
                    updated = true;
                }
                if (swReleaseIsConsuming === true && (smartUTxO.isReading !== undefined || smartUTxO.isConsuming !== undefined)) {
                    smartUTxO.isReading = undefined;
                    smartUTxO.isConsuming = undefined;
                    updated = true;
                }
                // Update the database only if a change was made
                if (updated) {
                    await this.update(smartUTxO);
                }
            }
            //-------------------------
        });
    }

    public static async reserveUTxO(
        txHash: string,
        outputIndex: number,
        date: Date,
        swForPreparing: boolean = true, // si es true, setea solo for prearing si no ya la marca como usada en reading o consuming
        swReserveForReading: boolean = false,
        swReserveForConsuming: boolean = false
    ): Promise<void> {
        //----------------------------
        if (txHash === undefined || txHash === '' || outputIndex === undefined || outputIndex < 0) {
            throw `txHash or outputIndex not defined`;
        }
        if (swReserveForReading === true && swReserveForConsuming === true) {
            throw `swReserveForReading and swReserveForConsuming can't be true at the same time`;
        }
        if (swReserveForReading === false && swReserveForConsuming === false) {
            throw `swReserveForReading and swReserveForConsuming can't be false at the same time`;
        }
        if (isFrontEndEnvironment()) {
            //return await this.releaseUTxOsApi(txHash, outputIndex);
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        return await DatabaseService().withContextTransaction(`[${this._Entity.className()}] - releaseUTxO`, async () => {
            //-------------------------
            const smartUTxO: SmartUTxOEntity | undefined = await this.getOneByParams_({ txHash, outputIndex });
            //-------------------------
            if (smartUTxO === undefined) {
                console_error(0, this._Entity.className(), `reserveUTxO - smartUTxO not found - txHash: ${txHash} - outputIndex: ${outputIndex}`);
            } else {
                let updated = false;
                if (swForPreparing === true) {
                    if (swReserveForReading === true) {
                        if (smartUTxO.isAvailableForReading() === true) {
                            if (smartUTxO.isReading === undefined || smartUTxO.isPreparingForReading !== date) {
                                smartUTxO.isReading = undefined;
                                smartUTxO.isPreparingForReading = date;
                                updated = true;
                            }
                        } else {
                            console_error(
                                0,
                                this._Entity.className(),
                                `reserveUTxO - smartUTxO is not available for preparing for reading - txHash: ${txHash} - outputIndex: ${outputIndex}`
                            );
                            throw `UTxO is not available for reading - txHash: ${txHash} - outputIndex: ${outputIndex}`;
                        }
                    }
                    if (swReserveForConsuming === true) {
                        if (smartUTxO.isAvailableForConsuming() === true) {
                            if (smartUTxO.isConsuming !== undefined || smartUTxO.isPreparingForConsuming !== date) {
                                smartUTxO.isConsuming = undefined;
                                smartUTxO.isPreparingForConsuming = date;
                                updated = true;
                            }
                        } else {
                            console_error(
                                0,
                                this._Entity.className(),
                                `reserveUTxO - smartUTxO is not available for preparing for consuming - txHash: ${txHash} - outputIndex: ${outputIndex}`
                            );
                            throw `UTxO is not available for consuming - txHash: ${txHash} - outputIndex: ${outputIndex}`;
                        }
                    }
                } else {
                    if (swReserveForReading === true) {
                        if (smartUTxO.isPreparingForReading !== undefined) {
                            if (smartUTxO.isReading !== date || smartUTxO.isPreparingForReading !== undefined) {
                                smartUTxO.isReading = date;
                                smartUTxO.isPreparingForReading = undefined;
                                updated = true;
                            }
                        } else {
                            console_error(0, this._Entity.className(), `reserveUTxO - smartUTxO is not available for reading - txHash: ${txHash} - outputIndex: ${outputIndex}`);
                            throw `UTxO is not available for reading - txHash: ${txHash} - outputIndex: ${outputIndex}`;
                        }
                    }
                    if (swReserveForConsuming === true) {
                        if (smartUTxO.isPreparingForConsuming !== undefined) {
                            if (smartUTxO.isConsuming !== date || smartUTxO.isPreparingForConsuming !== undefined) {
                                smartUTxO.isConsuming = date;
                                smartUTxO.isPreparingForConsuming = undefined;
                                updated = true;
                            }
                        } else {
                            console_error(0, this._Entity.className(), `reserveUTxO - smartUTxO is not available for consuming - txHash: ${txHash} - outputIndex: ${outputIndex}`);
                            throw `UTxO is not available for consuming - txHash: ${txHash} - outputIndex: ${outputIndex}`;
                        }
                    }
                }
                // Update the database only if a change was made
                if (updated) {
                    await this.update(smartUTxO);
                }
            }
            //-------------------------
        });
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

    //TODO: saque esto que calculaba autoamticamente los estados de uso de una utxo en fc de las transacciones que las usaban... como ahora es todo mas inteligente a la hora de cerar tx y de pasarlas a failed u otros estados, en estos metdoos se liberan las utxos
    // es como una forma manual, pero me gusta mas y tiene menos impacto que este metodo que se ejecutaria todo el tiempo al cargar utxos
    // el problema es que si yo creo una tx en created, y agrego un control como esta ahora en reserver utxo que controla que no esten en uso, y este metodo la carga y la setea en uso por esa misma tx, tiraria error que no es querido
    // tendria que cambiar la logica de reserva, etc, pero me gusta como esta ahora

    // public static async callbackOnAfterLoad<T extends BaseEntity>(instance: T, cascadeUpdate: CascadeUpdate): Promise<CascadeUpdate> {
    //     //--------------------------------------
    //     console_log(1, this._Entity.className(), `callbackOnAfterLoad - Init`);
    //     //--------------------------------------
    //     cascadeUpdate = await super.callbackOnAfterLoad(instance, cascadeUpdate);
    //     //--------------------------------------
    //     if (cascadeUpdate.swUpdate) {
    //         console_log(0, instance.className(), `callbackOnAfterLoad - updating because super.callbackOnAfterLoad...`);
    //     }
    //     //--------------------------------------
    //     const smartUTxOInstance = instance as unknown as SmartUTxOEntity;
    //     //-------------------
    //     // Call to get the 4 dates using outRef
    //     const outRefToSearch = smartUTxOInstance.getOutRef(); // Assuming you have an outRef to use for the search
    //     //----------------------------
    //     const TransactionBackEndApplied = (await import('./Transaction.BackEnd.Applied.js')).TransactionBackEndApplied;
    //     //----------------------------
    //     const { isPreparingForReading, isReading, isPreparingForConsuming, isConsuming } = await TransactionBackEndApplied.getReadingAndConsumingDates(outRefToSearch);
    //     //--------------------------------------
    //     const prev = {
    //         isPreparingForReading: smartUTxOInstance.isPreparingForReading,
    //         isReading: smartUTxOInstance.isReading,
    //         isPreparingForConsuming: smartUTxOInstance.isPreparingForConsuming,
    //         isConsuming: smartUTxOInstance.isConsuming,
    //     };
    //     //--------------------------------------
    //     // Update the new values
    //     smartUTxOInstance.isPreparingForReading = isPreparingForReading;
    //     smartUTxOInstance.isReading = isReading;
    //     smartUTxOInstance.isPreparingForConsuming = isPreparingForConsuming;
    //     smartUTxOInstance.isConsuming = isConsuming;
    //     //--------------------------------------
    //     const current = {
    //         isPreparingForReading: smartUTxOInstance.isPreparingForReading,
    //         isReading: smartUTxOInstance.isReading,
    //         isPreparingForConsuming: smartUTxOInstance.isPreparingForConsuming,
    //         isConsuming: smartUTxOInstance.isConsuming,
    //     };
    //     //--------------------------------------
    //     let updatedFields: Record<string, { from: any; to: any }> = {};
    //     let swUpdateValues = false;
    //     //--------------------------------------
    //     Object.entries(prev).forEach(([key, value]) => {
    //         // Check if the value is a Date object
    //         if (value instanceof Date && current[key as keyof typeof current] instanceof Date) {
    //             if (value.getTime() !== current[key as keyof typeof current]?.getTime()) {
    //                 updatedFields[key] = {
    //                     from: value,
    //                     to: current[key as keyof typeof current],
    //                 };
    //                 swUpdateValues = true;
    //             }
    //         } else if (value !== current[key as keyof typeof current]) {
    //             // Non-date values can be compared as usual
    //             updatedFields[key] = {
    //                 from: value,
    //                 to: current[key as keyof typeof current],
    //             };
    //             swUpdateValues = true;
    //         }
    //     });
    //     //--------------------------------------
    //     if (swUpdateValues) {
    //         console_log(0, instance.className(), `callbackOnAfterLoad - updating because updatedValues - which fields: ${toJson({ updatedFields })}`);
    //         cascadeUpdate = { swUpdate: true, updatedFields };
    //     }
    //     //--------------------------------------
    //     console_log(-1, this._Entity.className(), `callbackOnAfterLoad  - OK`);
    //     //-------------------------------------
    //     return cascadeUpdate;
    // }

    // #endregion callbacks
}
