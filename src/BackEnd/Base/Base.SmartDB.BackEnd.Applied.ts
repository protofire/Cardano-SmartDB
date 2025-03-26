import { LucidEvolution } from '@lucid-evolution/lucid';
import { OptionsGet, OptionsGetOne } from '../../Commons/index.js';
import { BackEndAppliedFor } from '../../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import { AddressToFollowEntity, EmulatorEntity } from '../../Entities/index.js';
import { BaseSmartDBEntity } from '../../Entities/Base/Base.SmartDB.Entity.js';
import { BaseSmartDBBackEndMethods } from './Base.SmartDB.BackEnd.Methods.js';
import { BaseBackEndApplied } from './Base.BackEnd.Applied.js';

// Api Handlers siempre llevan una Entity y el backend methods, es especifico para cada entidad
// Se tiene entonces que crear uno por cada Entidad SI o SI

@BackEndAppliedFor(BaseSmartDBEntity)
export class BaseSmartDBBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = BaseSmartDBEntity;
    protected static _BackEndMethods = BaseSmartDBBackEndMethods;

    public static getBack() {
        return this._BackEndMethods;
    }

    // #region class methods applied to entity

    public static async getBySmartUTxO_<T extends BaseSmartDBEntity>(
        smartUTxO_id: string,
        optionsGet?: OptionsGetOne,
        restricFilter?: Record<string, any>
    ): Promise<T | undefined> {
        return await this.getBack().getBySmartUTxO<T>(this._Entity, smartUTxO_id, optionsGet, restricFilter);
    }

    public static async getDeployed_<T extends BaseSmartDBEntity>(optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]> {
        return await this.getBack().getDeployed<T>(this._Entity, optionsGet, restricFilter);
    }

    public static async createHook_<T extends BaseSmartDBEntity>(address: string, CS: string, TN_Str?: string): Promise<void> {
        return await this.getBack().createHook<T>(this._Entity, address, CS, TN_Str);
    }

    public static async syncWithAddress_<T extends BaseSmartDBEntity>(
        lucid: LucidEvolution,
        emulatorDB: EmulatorEntity | undefined,
        addressToFollow: AddressToFollowEntity,
        force: boolean | undefined,
        tryCountAgain: boolean = true
    ) {
        return await this.getBack().syncWithAddress<T>(this._Entity, lucid, emulatorDB, addressToFollow, force, tryCountAgain);
    }

    public static async parseBlockchainAddress_<T extends BaseSmartDBEntity>(
        jobId: string,
        address: string,
        datumType: string,
        fromBlock?: number,
        toBlock?: number,
        message?: string
    ): Promise<boolean> {
        return await this.getBack().parseBlockchainAddress<T>(this._Entity, jobId, address, datumType, fromBlock, toBlock, message);
    }

    // #endregion class methods applied to entity
}
