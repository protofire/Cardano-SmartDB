import { Constr, TxHash } from 'lucid-cardano';
import { BaseConstructor } from '../Entities/Base/Base.Constructor.js';
import { itemToLucidData } from './data.js';
//lo uso como class a diferencia del resto, por que a la hora de convertir el datum y el redeemer a plutusData, el campo de Hash aqui no se convierte igual que un string y si no tengo clase no podria diferenciarlo de una string en ese momento.
export class TxOutRef {
    _plutusDataIndex = 0;

    txHash: TxHash;
    outputIndex: number;

    constructor(txHash: TxHash, outputIndex: number) {
        this.txHash = txHash;
        this.outputIndex = outputIndex;
    }

    public toPlutusData() {
        let list: any[] = [];
        list.push(new Constr(0, [this.txHash]));
        list.push(this.outputIndex);
        const res = new Constr(this._plutusDataIndex, list);
        return res;
    }
}

export class Maybe<T> {
    _plutusDataIndex = 0 | 1;
    val: T | undefined;

    constructor(val?: T) {
        if (val !== undefined) {
            this.val = val;
            this._plutusDataIndex = 0;
        } else {
            this.val = undefined;
            this._plutusDataIndex = 1;
        }
    }

    // public static toPlainObject(value: any | undefined): any | undefined {
    //     return value?.val;
    // }

    public static fromPlainObject(value: any | undefined): any | undefined {
        const instance = new Maybe(value?.val);
        return instance;
    }

    // public static toPlainObject_BigInt(value: any | undefined): any | undefined {
    //     return value?.val?.toString();
    // }

    public static fromPlainObject_BigInt(value: any | undefined): any | undefined {
        const val = value?.val === undefined ? undefined : BigInt(value?.val);
        const instance = new Maybe<BigInt>(val);
        return instance;
    }

    public toPlutusData() {
        const res = new Constr(this._plutusDataIndex, this.val !== undefined ? [itemToLucidData(this.val, `Maybe Val`)] : []);
        return res;
    }

    public static fromPlutusData(lucidDataForDatum: any) {
        if (lucidDataForDatum.index === 0) {
            if (lucidDataForDatum.fields.length === 1) {
                return new Maybe(lucidDataForDatum.fields[0]);
            }
        } else if (lucidDataForDatum.index === 1) {
            if (lucidDataForDatum.fields.length === 0) {
                return new Maybe();
            }
        }

        throw `Maybe - Can't get from Datum`;
    }

    public static fromPlutusData_Number(lucidDataForDatum: any) {
        const maybeNumber = Maybe.fromPlutusData(lucidDataForDatum);
        if (maybeNumber.val !== undefined) {
            maybeNumber.val = Number(maybeNumber.val);
        }
        return maybeNumber;
    };
}

//-------------------------------------------------------------

export class MinMaxDef<T> extends BaseConstructor {
    mmdMin!: T;
    mmdMax!: T;
    mmdDef!: T;

    // public static toPlainObject_BigInt(value: any | undefined): any | undefined {
    //     if (value === undefined) return undefined

    //     let serialized: any = {
    //         mmdMin: value?.mmdMin?.toString(),
    //         mmdMax: value?.mmdMax?.toString(),
    //         mmdDef: value?.mmdDef?.toString()
    //     };
    //     return serialized
    // }

    public static fromPlainObject_BigInt(value: any | undefined): any | undefined {
        if (value === undefined) return undefined;

        const instance = new MinMaxDef<BigInt>({
            mmdMin: BigInt(value?.mmdMin),
            mmdMax: BigInt(value?.mmdMax),
            mmdDef: BigInt(value?.mmdDef),
        });
        return instance;
    }

    public toPlutusData() {
        let list: any[] = [];
        list.push(itemToLucidData(this.mmdMin, `Min Max Def - min`));
        list.push(itemToLucidData(this.mmdMax, `Min Max Def - max`));
        list.push(itemToLucidData(this.mmdDef, `Min Max Def - def`));
        const res = new Constr(0, list);
        return res;
    }

    public static fromPlutusData<T>(lucidDataForDatum: any) {
        const objectInstance: any = {};
        if (lucidDataForDatum.index === 0) {
            const lucidDataForConstr0 = lucidDataForDatum.fields;
            if (lucidDataForConstr0.length === 3) {
                objectInstance.mmdMin = lucidDataForConstr0[0] as T;
                objectInstance.mmdMax = lucidDataForConstr0[1] as T;
                objectInstance.mmdDef = lucidDataForConstr0[2] as T;
                return new this({ ...objectInstance });
            }
        }
        throw `MinMaxDef - Can't get from Datum`;
    }

    public static fromPlutusData_Number (lucidDataForDatum: any)  {
        const mmd = MinMaxDef.fromPlutusData(lucidDataForDatum);
        mmd.mmdDef = Number(mmd.mmdDef);
        mmd.mmdMin = Number(mmd.mmdMin);
        mmd.mmdMax = Number(mmd.mmdMax);
        return mmd;
    };
}
