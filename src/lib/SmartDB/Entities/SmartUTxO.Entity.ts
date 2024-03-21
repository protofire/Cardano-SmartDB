import { Datum, DatumHash, Script, UTxO, type Address, type Assets, type TxHash } from "lucid-cardano";
import 'reflect-metadata';
import { toJson } from '@/src/utils/commons/utils';
import { Convertible, TxOutRef, asEntity } from '../Commons';
import { deserealizeAssets } from '../Commons/conversions';
import { BaseEntity } from './Base/Base.Entity';

@asEntity()
export class SmartUTxOEntity extends BaseEntity {
    protected static _className: string = 'Smart UTxO';
    protected static _apiRoute: string = 'smartutxos';

    // #region fields

    @Convertible()
    address!: Address;

    @Convertible()
    txHash!: TxHash;

    @Convertible()
    outputIndex!: number;

    @Convertible({ type: Date })
    isPreparing!: Date | undefined;

    @Convertible({ type: Date })
    isConsuming!: Date | undefined;

    @Convertible({
        fromPlainObject: deserealizeAssets,
        // toPlainObject: serializeAssets
    })
    assets!: Assets;

    @Convertible({ type: String })
    datumHash!: DatumHash | undefined;

    @Convertible({ type: String })
    datum!: Datum | undefined;

    @Convertible()
    datumObj!: Object | undefined;

    @Convertible({ type: Object })
    scriptRef!: Script | undefined;

    @Convertible()
    _NET_id_CS!: string;

    @Convertible()
    _NET_id_TN!: string;

    @Convertible()
    _is_NET_id_Unique!: boolean;

    @Convertible()
    datumType!: string;

    // #endregion fields


    // #region class methods

    public show(): string {
        const object = {
            _DB_id: this._DB_id,
            txHash: this.txHash,
            outputIndex: this.outputIndex,
        };
        return toJson(object);
    }

    public getTxOutRef<T extends SmartUTxOEntity>(): TxOutRef {
        return new TxOutRef(this.txHash, this.outputIndex);
    }

    public getUTxO<T extends SmartUTxOEntity>(): UTxO {
        const uTxO: UTxO = {
            txHash: this.txHash,
            outputIndex: this.outputIndex,
            assets: this.assets,
            address: this.address,
            datumHash: this.datumHash,
            datum: this.datum,
            scriptRef: this.scriptRef,
        };
        return uTxO;
    }

    // #endregion class methods
}
