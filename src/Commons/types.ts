import { Address, Data, Lucid, PaymentKeyHash, SignedMessage, UTxO } from 'lucid-cardano';
import { ISODateString } from 'next-auth';
import yup from './yupLocale.js';

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
    TN_Hex: TN;
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
    rewardAddress?: Address;
    utxos: UTxO[];
}

export const scriptSchema = yup.object().shape({
    type: yup.mixed<'Native' | 'PlutusV1' | 'PlutusV2'>().oneOf(['Native', 'PlutusV1', 'PlutusV2']).required(),
    script: yup.string().required(),
});

export const utxoSchema = yup.object().shape({
    txHash: yup.string().required(),
    outputIndex: yup.number().required(),
    assets: yup.object().required(), // Define the schema for Assets if needed
    address: yup.string().required(),
    datumHash: yup.string().optional().nullable(),
    datum: yup.string().optional().nullable(),
    // scriptRef: yup.lazy((value) =>
    //     value === undefined ? yup.mixed().optional() : scriptSchema.required()
    // ),
    // scriptRef2: yup.lazy((value) => {
    //     return value ? scriptSchema.required() : yup.object().notRequired().nullable();
    //   }),
});

export const walletTxParamsSchema = yup.object().shape({
    pkh: yup.string().required(),
    stakePkh: yup.string().optional(),
    address: yup.string().required(),
    rewardAddress: yup.string().optional(),
    utxos: yup.array().of(utxoSchema).required(),
});

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
    purpose: 'mint' | 'spend';
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
    walletNameOrSeedOrKey: string;
    address: Address;
    pkh: PaymentKeyHash;
    stakePkh: PaymentKeyHash | undefined;
    useBlockfrostToSubmit: boolean;
    isWalletFromSeed: boolean;
    isWalletFromKey: boolean;
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
//---------------------------------

export interface CardanoWallet {
    wallet: string;
    name: string;
    icon: URL;
    link: string;
    isInstalled?: boolean;
}

//---------------------------------

export type ConversionFunctions<T> = {
    type?: Function;
    isArray?: boolean;
    interfaceName?: string;
    propertyToFill?: string;
    relation?: string;
    typeRelation?: Function;
    cascadeLoad?: boolean;
    cascadeSave?: boolean;
    isDB_id?: boolean;
    isUnique?: boolean;
    isForDatum?: boolean;
    optionsGet?: OptionsGet | OptionsGetOne;
    optionsCreateOrUpdate?: OptionsCreateOrUpdate;
    toMongoInterface?: (value: any | undefined) => T | undefined;
    fromMongoInterface?: (value: T | undefined) => any | undefined;
    toPostgreSQLInterface?: (value: any | undefined) => T | undefined;
    fromPostgreSQLInterface?: (value: T | undefined) => any | undefined;
    toPlainObject?: (value: any | undefined) => Object | undefined;
    fromPlainObject?: (value: Object | undefined) => any | undefined;
    toPlutusData?: (value: any | undefined) => Data | undefined;
    fromPlutusData?: (lucidDataForDatum: any) => any;
};
//---------------------------------
