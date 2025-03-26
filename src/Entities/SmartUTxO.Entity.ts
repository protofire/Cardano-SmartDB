import { Datum, DatumHash, OutRef, Script, UTxO, type Address, type Assets, type TxHash } from '@lucid-evolution/lucid';
import 'reflect-metadata';
import { Convertible, TxOutRef, asEntity, formatDate, toJson } from '../Commons/index.js';
import { deserealizeAssets } from '../Commons/conversions.js';
import { BaseEntity } from './Base/Base.Entity.js';

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
    isPreparingForReading!: Date | undefined;

    @Convertible({ type: Date })
    isReading!: Date | undefined;

    @Convertible({ type: Date })
    isPreparingForConsuming!: Date | undefined;

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
    _NET_id_TN_Str!: string;

    @Convertible()
    _is_NET_id_Unique!: boolean;

    @Convertible()
    datumType!: string;

    @Convertible({ isCreatedAt: true })
    createdAt!: Date;

    @Convertible({ isUpdatedAt: true })
    updatedAt!: Date;

    // #endregion fields

    // #region db

    // #endregion db

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

    public getOutRef<T extends SmartUTxOEntity>(): OutRef {
        const outRef: OutRef = {
            txHash: this.txHash,
            outputIndex: this.outputIndex,
        };
        return outRef;
    }

    public showStatus(): string {
        if (this.isPreparingForConsuming) {
            if (this.isConsuming) {
                return `Reserved for Consuming: Preparing since ${formatDate(this.isPreparingForConsuming)}, In transaction since ${formatDate(this.isConsuming)}`;
            }
            return `Reserved for Consuming: Preparing since ${formatDate(this.isPreparingForConsuming)}`;
        }

        if (this.isConsuming) {
            return `Reserved: In transaction since ${formatDate(this.isConsuming)}`;
        }

        if (this.isPreparingForReading) {
            if (this.isReading) {
                return `Reserved for Reading: Preparing since ${formatDate(this.isPreparingForReading)}, In reading since ${formatDate(this.isReading)}`;
            }
            return `Reserved for Reading: Preparing since ${formatDate(this.isPreparingForReading)}`;
        }

        if (this.isReading) {
            return `Reserved: In reading since ${formatDate(this.isReading)}`;
        }

        return 'Available';
    }

    // NOTE: estos metodos solo sirven para mostrar en frontend, por que los valores de estos campos no estan actualizados
    // se actualizan con el callbackonload, pero lo mas poreciso es buscar en transactions getReadingAndConsumingDates
    public isAvailableForReading<T extends SmartUTxOEntity>(): Boolean {
        // para que pueda ser usada como utxo de lectura, por referencia, debe estar no en uso para consumo
        // es indiferente si está en uso para lectura por otro proceso
        return this.isPreparingForConsuming === undefined && this.isConsuming === undefined;
    }

    public isAvailableForConsuming<T extends SmartUTxOEntity>(): Boolean {
        // para que pueda ser usada como utxo de consumo, debe estar no en uso para lectura ni consumo
        return this.isPreparingForReading === undefined && this.isReading === undefined && this.isPreparingForConsuming === undefined && this.isConsuming === undefined;
    }

    // #endregion class methods
}
