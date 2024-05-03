import { Lucid } from "lucid-cardano";
import { OptionsGet, OptionsGetOne } from '../../Commons';
import { BackEndAppliedFor } from '../../Commons/Decorator.BackEndAppliedFor';
import { AddressToFollowEntity, EmulatorEntity } from '../../Entities';
import { BaseSmartDBEntity } from '../../Entities/Base/Base.SmartDB.Entity';
import { BaseSmartDBBackEndMethods } from './Base.SmartDB.BackEnd.Methods';
import { BaseBackEndApplied } from './Base.BackEnd.Applied';

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

    public static async getDeployed_<T extends BaseSmartDBEntity>( optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]> {
        return await this.getBack().getDeployed<T>(this._Entity, optionsGet, restricFilter);
    }

    public static async syncWithAddress_<T extends BaseSmartDBEntity>(
        lucid: Lucid,
        emulatorDB: EmulatorEntity | undefined,
        addressToFollow: AddressToFollowEntity,
        force: boolean | undefined,
        tryCountAgain: boolean = true
    ) {
        return await this.getBack().syncWithAddress<T>(this._Entity, lucid, emulatorDB, addressToFollow, force, tryCountAgain);
    }

    // #endregion class methods applied to entity
}
