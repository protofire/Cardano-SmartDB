import { Address, Constr, Lucid, PaymentKeyHash, SignedMessage, TxHash, UTxO } from 'lucid-cardano';
import { BaseConstructor } from '../Entities/Base/Base.Constructor';
import { itemToLucidData } from './data';
import yup from './yupLocale';
import { ISODateString } from 'next-auth';

export type PaymentPubKey = string;
export type StakeCredentialPubKeyHash = PaymentKeyHash;

export type PaymentAndStakePubKeyHash = {
    paymentPkh: PaymentKeyHash | undefined;
    stakePkh: StakeCredentialPubKeyHash | undefined;
};

export type AC = string;
export type CS = string;
export type TN = string;

export type POSIXTime = bigint;

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

    public static fromPlutusData_Number = (lucidDataForDatum: any) => {
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

    public static fromPlutusData_Number = (lucidDataForDatum: any) => {
        const mmd = MinMaxDef.fromPlutusData(lucidDataForDatum);
        mmd.mmdDef = Number(mmd.mmdDef);
        mmd.mmdMin = Number(mmd.mmdMin);
        mmd.mmdMax = Number(mmd.mmdMax);
        return mmd;
    };
}

export interface LookUpFields {
    from: string; // The collection to join with
    localField: string; // The field from the input documents (orders)
    foreignField: string; // The field from the documents of the "from" collection (users)
    as: string; // The array field output containing the joined document(s)'
    fieldsForSelect?: Record<string, boolean>;
}

export interface OptionsGet {
    skip?: number;
    limit?: number;
    sort?: Record<string, number>;
    fieldsForSelect?: Record<string, boolean>;
    doCallbackAfterLoad?: boolean;
    loadRelations?: Record<string, boolean>;
    optionsGetForRelation?: Record<string, OptionsGet>;
    checkRelations?: boolean;
    lookUpFields?: LookUpFields[];
}

export const optionsGetDefault: OptionsGet = {
    // se isan cuando no hay options get seteadas
    skip: undefined,
    limit: undefined,
    sort: undefined,
    fieldsForSelect: undefined, // al ser undefined se remplaza por defaultFieldsWhenUndefined, que es {} por default. {} son todos los campos
    doCallbackAfterLoad: false,
    loadRelations: undefined, // levanta las relaciones segun la definicion de cada entidad de esa relacion
    optionsGetForRelation: undefined,
    // primero veo si vienen option get para la relacion en particular
    // si no, cargo las que estan en la conversion en la definicion de la entidad padre y si no hay, cargo con las mismas opciones las mismas de la entidad padre
    checkRelations: false,
    lookUpFields: undefined,
};

export const optionsGetMinimal: OptionsGet = {
    skip: undefined,
    limit: undefined,
    sort: undefined,
    fieldsForSelect: { _id: true }, // solo trae el campo id, si lo seteo en {} trae todos los campos
    doCallbackAfterLoad: false,
    loadRelations: {}, // no levanta relaciones
    optionsGetForRelation: undefined,
    checkRelations: false,
    lookUpFields: undefined,
};

export const optionsGetMinimalWithSmartUTxO: OptionsGet = {
    skip: undefined,
    limit: undefined,
    sort: undefined,
    fieldsForSelect: { _id: true },
    doCallbackAfterLoad: false,
    loadRelations: { smartUTxO_id: true },
    optionsGetForRelation: { smartUTxO_id: optionsGetMinimal },
    checkRelations: false,
    lookUpFields: undefined,
};

export const optionsGetAllFields: OptionsGet = {
    fieldsForSelect: {},
};

export interface OptionsGetOne {
    sort?: Record<string, number>;
    fieldsForSelect?: Record<string, boolean>;
    doCallbackAfterLoad?: boolean;
    loadRelations?: Record<string, boolean>;
    optionsGetForRelation?: Record<string, OptionsGet>;
    checkRelations?: boolean;
    lookUpFields?: LookUpFields[];
}

export const optionsGetOneDefault: OptionsGetOne = {
    sort: undefined,
    fieldsForSelect: undefined,
    doCallbackAfterLoad: false,
    loadRelations: undefined,
    optionsGetForRelation: undefined,
    checkRelations: false,
    lookUpFields: undefined,
};

export interface OptionsCreateOrUpdate {
    doCallbackAfterLoad?: boolean;
    saveRelations?: Record<string, boolean>;
    loadRelations?: Record<string, boolean>;
}

export const optionsCreateOrUpdateDefault: OptionsCreateOrUpdate = {
    doCallbackAfterLoad: false,
    saveRelations: undefined,
    loadRelations: undefined,
};

export interface OptionsDelete {
    deleteRelations?: Record<string, boolean>;
}

export const optionsDeleteDefault: OptionsDelete = {
    deleteRelations: undefined,
};

export interface CascadeUpdate {
    swUpdate: boolean;
    updatedFields?: Record<string, { from: string; to: string }>;
}

// Schema for validating LookUpFields
export const lookUpFieldsSchema = yup.object().shape({
    from: yup.string().required(),
    localField: yup.string().required(),
    foreignField: yup.string().required(),
    as: yup.string().required(),
    fieldsForSelect: yup
        .object()
        .test(
            'valid-fieldsForSelect',
            'FieldsForSelect must be an object with fields and boolean values.',
            (value) => !value || Object.values(value).every((val) => typeof val === 'boolean')
        ),
});

// Define a placeholder outside the schema to reference it recursively
const optionsGetSchemaPlaceholder: any = {};

export const yupValidateOptionsGet = {
    skip: yup.number().positive().integer().optional(),
    limit: yup.number().positive().integer().optional(),
    sort: yup
        .object()
        .test(
            'valid-sort',
            'Sort must be an object with fields and number values indicating order direction.',
            (value) => !value || Object.values(value).every((val) => typeof val === 'number' && (val === 1 || val === -1))
        ),
    fieldsForSelect: yup
        .object()
        .test(
            'valid-fieldsForSelect',
            'FieldsForSelect must be an object with fields and boolean values.',
            (value) => !value || Object.values(value).every((val) => typeof val === 'boolean')
        ),
    doCallbackAfterLoad: yup.boolean().optional(),
    loadRelations: yup
        .object()
        .test(
            'valid-loadRelations',
            'LoadRelations must be an object with relations and boolean values.',
            (value) => !value || Object.values(value).every((val) => typeof val === 'boolean')
        ),
    //optionsGetForRelation: yup.lazy(() => optionsGetSchemaPlaceholder),
    checkRelations: yup.boolean().optional(),
    lookUpFields: yup.array().of(lookUpFieldsSchema).optional(),
};

// // Assign the actual schema to the placeholder to enable recursion
// optionsGetSchemaPlaceholder.__isYupSchema__ = true;
// optionsGetSchemaPlaceholder.innerType = yupValidateOptionsGet;

export const yupValidateOptionsGetOne = {
    sort: yup
        .object()
        .test(
            'valid-sort',
            'Sort must be an object with fields and number values indicating order direction.',
            (value) => !value || Object.values(value).every((val) => typeof val === 'number' && (val === 1 || val === -1))
        ),
    fieldsForSelect: yup
        .object()
        .test(
            'valid-fieldsForSelect',
            'FieldsForSelect must be an object with fields and boolean values.',
            (value) => !value || Object.values(value).every((val) => typeof val === 'boolean')
        ),
    doCallbackAfterLoad: yup.boolean().optional(),
    loadRelations: yup
        .object()
        .test(
            'valid-loadRelations',
            'LoadRelations must be an object with relations and boolean values.',
            (value) => !value || Object.values(value).every((val) => typeof val === 'boolean')
        ),
    //optionsGetForRelation: yup.lazy(() => optionsGetSchemaPlaceholder),
    checkRelations: yup.boolean().optional(),
    lookUpFields: yup.array().of(lookUpFieldsSchema).optional(),
};

export const yupValidateOptionsCreate = {
    doCallbackAfterLoad: yup.boolean().optional(),
    saveRelations: yup
        .object()
        .test(
            'valid-saveRelations',
            'SaveRelations must be an object with relations and boolean values.',
            (value) => !value || Object.values(value).every((val) => typeof val === 'boolean')
        ),
    loadRelations: yup
        .object()
        .test(
            'valid-loadRelations',
            'LoadRelations must be an object with relations and boolean values.',
            (value) => !value || Object.values(value).every((val) => typeof val === 'boolean')
        ),
};

export const yupValidateOptionsUpdate = yupValidateOptionsCreate;

export const yupValidateOptionsDelete = {
    deleteRelations: yup.object().test('valid-deleteRelations', 'DeleteRelations must be an object with relations and boolean values.', (value) => {
        return !value || Object.values(value).every((val) => typeof val === 'boolean');
    }),
};

// export type CurrencySymbol = string;

// export type TokenName = string;

// export type AssetClass = {
//     currencySymbol: CurrencySymbol;
//     tokenName: TokenName;
// };

export type Decimals = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;

export type Token = {
    CS: CS;
    TN: TN;
};

export type Token_With_Metadata = Token & {
    decimals?: Decimals;
    image?: string;
    colorHex?: string;
    metadata_raw?: Record<string, any>;
};
export type Token_With_Metadata_And_Amount = Token_With_Metadata & { amount: bigint };

export type Token_With_Price = Token & { priceADAx1e6: bigint };

export type Token_With_Price_And_Metadata = Token_With_Price & Token_With_Metadata;

export type Token_Historic_Price = { priceADAx1e6: bigint; date: POSIXTime };

export type Token_With_Price_And_Date = Token & { priceADAx1e6: bigint | undefined; date: POSIXTime | undefined };

export type Token_With_Price_And_Date_And_Signature = Token_With_Price_And_Date & { signature: SignedMessage | undefined };
export type Token_With_Price_And_Date_And_Signature_And_Metadata = Token_With_Price_And_Date_And_Signature & Token_With_Metadata;

export type Token_With_Price_And_Date_And_Signature_And_Validity = Token_With_Price_And_Date_And_Signature & { validity: POSIXTime | undefined };
export type Token_With_Price_And_Date_And_Signature_And_Validity_And_Metadata = Token_With_Price_And_Date_And_Signature_And_Validity & Token_With_Metadata;

export type Token_With_Price_And_Date_And_Signature_And_Amount = Token_With_Price_And_Date_And_Signature & { amount: bigint };
export type Token_With_Price_And_Date_And_Signature_And_Amount_And_Metadata = Token_With_Price_And_Date_And_Signature_And_Amount & Token_With_Metadata;

export type Token_With_Price_And_Date_And_Signature_And_Amount_And_Metadata_And_Percentage = Token_With_Price_And_Date_And_Signature_And_Amount_And_Metadata & {
    percentage: bigint;
};

export type TokensWithMetadataAndAmount = Token_With_Metadata_And_Amount[];

export type TokensParticipation = Token_With_Price_And_Date_And_Signature_And_Amount_And_Metadata_And_Percentage & {
    fundName: string;
};

export interface UTxOWithDetails extends UTxO {
    hasScriptRef: string;
    assetWithDetails: TokensWithMetadataAndAmount;
}

//-------------------------------------------------------------

export interface WalletTxParams {
    pkh: PaymentKeyHash;
    stakePkh?: StakeCredentialPubKeyHash;
    address: Address;
    rewardAddress: Address | undefined;
    utxos: UTxO[];
}

//-------------------------------------------------------------

export type TransactionDatum = {
    address: string;
    datumType: string | undefined;
    // datumHash: DatumHash | undefined;
    // datum: Datum | undefined;
    datumObj: Object | undefined;
};

export type TransactionRedeemer = {
    tx_index: number;
    purpose: string;
    script_hash?: string;
    redeemer_data_hash?: string;
    datum_hash?: string;
    unit_mem?: string;
    unit_steps?: string;
    fee?: string;
    redeemerObj?: Object;
};

//-------------------------------------------------------------

declare module 'next-auth' {
    export interface User extends SessionWalletInfo {
        id?: string;
    }

    export interface JWT extends SessionWalletInfo {}

    export interface Session {
        user?: User;
        expires: ISODateString;
    }
}

export interface ConnectedWalletInfo {
    network: string;
    walletName: string;
    address: Address;
    pkh: PaymentKeyHash;
    stakePkh: PaymentKeyHash | undefined;
    useBlockfrostToSubmit: boolean;
    isWalletFromSeedOrKey: boolean;
    isWalletValidatedWithSignedToken: boolean;
}

export interface SessionWalletInfo extends ConnectedWalletInfo {
    isCoreTeam: boolean;
}

export interface Wallet {
    lucid: Lucid | undefined;
    protocolParameters: any;
    info: ConnectedWalletInfo | undefined;
}

//-------------------------------------------------------------

export interface TaskComponentProps {
    onTaskLoading?: () => Promise<void>;
    onTaskLoaded?: () => Promise<void>;
    scrollToTask?: () => void;
    // refToGoWhenFinishTask?: RefObject<HTMLDivElement>
    onFinishTask?: (swBackToDashboard?: boolean, unsetPreviusEntityId?: boolean) => Promise<void>;
}

export interface ActionComponentProps {
    onConfirmation?: () => Promise<void>;
    onCancel?: () => Promise<void>;
}

export interface CreateComponentProps {
    onCreate?: (id?: string) => Promise<void>;
    onCancel?: () => Promise<void>;
}
export interface UpdateComponentProps {
    onUpdate?: () => Promise<void>;
    onCancel?: () => Promise<void>;
}

export interface DeleteComponentProps {
    onCancel?: () => Promise<void>;
}

export interface TxComponentProps {
    onTx?: () => Promise<void>;
    onCancel?: () => Promise<void>;
}

export interface ListComponentProps {
    onCancel?: () => Promise<void>;
    swShowBtnAdmin?: boolean;
    swShowBtnCreate?: boolean;
    swShowBtnDelete?: boolean;
    swShowBtnUpdate?: boolean;
    swShowBtnDeployTx?: boolean;
    swShowBtnUpdateTx?: boolean;
    swShowBtnDeleteTx?: boolean;
}
