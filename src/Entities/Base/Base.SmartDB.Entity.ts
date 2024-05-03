import 'reflect-metadata';
import { C, Constr, Data, fromHex, type PaymentKeyHash } from 'lucid-cardano';
import { itemToLucidData } from '../../Commons/data';
import { ConversionFunctions, Convertible, getCombinedConversionFunctions, isNullOrBlank, showPtrInHex, strToHex } from '../../Commons';
import { deserealizeBigInt } from '../../Commons/conversions';
import { AddressToFollowEntity } from '../AddressToFollow.Entity';
import { SmartUTxOEntity } from '../SmartUTxO.Entity';
import { BaseEntity } from './Base.Entity';

// export abstract class SmartDBBaseEntity {
//     @OneToOne(() => SmartUTxOPostgres)
//     @JoinColumn({ name: 'smartUTxO_id' })
//     smartUTxO!: Relation<SmartUTxOPostgres>;
// }

// export interface IBaseSmartDBEntity {
//     _creator: PaymentKeyHash;
//     _NET_address: string;
//     _NET_id_CS: string | undefined;
//     _NET_id_TN: string | undefined;
//     _isDeployed: boolean;
//     smartUTxO_id: Types.ObjectId | undefined;
// }

export class BaseSmartDBEntity extends BaseEntity {
    protected static _plutusDataIndex = 0;
    protected static _plutusDataIsSubType = true;
    // si es only datum sera creado cuando se encuentre una utxo y sera eliminando cuando no exista utxo
    protected static _isOnlyDatum = true;
    // si tiene id NFT en el datum o si es un FT
    protected static _is_NET_id_Unique = true;

    // #region fields

    @Convertible()
    _creator!: PaymentKeyHash;

    @Convertible({
        toMongoInterface: function (value: any) {
            if ((this as any).getNet_Address) {
                return (this as any).getNet_Address();
            } else {
                return value;
            }
        },
        toPlainObject: function (value: any) {
            if ((this as any).getNet_Address) {
                return (this as any).getNet_Address();
            } else {
                return value;
            }
        },
    })
    _NET_address!: string;

    @Convertible({
        toMongoInterface: function (value: any) {
            if ((this as any).getNET_id_CS) {
                return (this as any).getNET_id_CS();
            } else {
                return value;
            }
        },
        toPlainObject: function (value: any) {
            if ((this as any).getNET_id_CS) {
                return (this as any).getNET_id_CS();
            } else {
                return value;
            }
        },
    })
    _NET_id_CS!: string;

    @Convertible({
        toMongoInterface: function (value: any) {
            if ((this as any).getNET_id_TN) {
                return (this as any).getNET_id_TN();
            } else {
                return value;
            }
        },
        toPlainObject: function (value: any) {
            if ((this as any).getNET_id_TN) {
                return (this as any).getNET_id_TN();
            } else {
                return value;
            }
        },
    })
    _NET_id_TN!: string;

    @Convertible()
    _isDeployed: boolean = true;

    @Convertible({ type: String, propertyToFill: 'smartUTxO', relation: 'OneToOne', typeRelation: SmartUTxOEntity, cascadeSave: true, cascadeLoad: false })
    smartUTxO_id!: string | undefined;
    smartUTxO!: SmartUTxOEntity | undefined;

    @Convertible({ propertyToFill: 'addressToFollow', relation: 'OneToOne', typeRelation: AddressToFollowEntity })
    addressToFollow_id!: string;
    addressToFollow!: AddressToFollowEntity | undefined;

    // #endregion fields

    // #region db

    public static alwaysFieldsForSelect: Record<string, boolean> = {
        ...super.alwaysFieldsForSelect,
        _creator: true,
        _NET_address: true,
        _NET_id_CS: true,
        _NET_id_TN: true,
        _isDeployed: true,
        smartUTxO_id: true,
    };

    public static datumFieldsForSelect(): Record<string, boolean> {
        const fields: Record<string, boolean> = {};
        const conversionFunctions = getCombinedConversionFunctions(this);
        if (conversionFunctions) {
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                if (conversions.isForDatum === true) {
                    fields[propertyKey] = true;
                }
            }
        }
        return fields;
    }

    // #endregion db

    // #region class methods

    public getStatic(): typeof BaseSmartDBEntity {
        return this.constructor as typeof BaseSmartDBEntity;
    }

    public static getStatic(): typeof BaseSmartDBEntity {
        return this as typeof BaseSmartDBEntity;
    }

    public plutusDataIndex() {
        return this.getStatic()._plutusDataIndex;
    }

    public static plutusDataIndex() {
        return this._plutusDataIndex;
    }

    public plutusDataIsSubType() {
        return this.getStatic()._plutusDataIsSubType;
    }

    public static plutusDataIsSubType() {
        return this._plutusDataIsSubType;
    }

    public isOnlyDatum<T extends BaseSmartDBEntity>(): boolean {
        return this.getStatic()._isOnlyDatum;
    }

    public static isOnlyDatum<T extends BaseSmartDBEntity>(): boolean {
        return this._isOnlyDatum;
    }

    public is_NET_id_Unique<T extends BaseSmartDBEntity>(): boolean {
        return this.getStatic()._is_NET_id_Unique;
    }

    public static is_NET_id_Unique<T extends BaseSmartDBEntity>(): boolean {
        return this._is_NET_id_Unique;
    }

    public getNet_Address<T extends BaseSmartDBEntity>(): string {
        return this._NET_address;
    }

    public getNET_id_CS<T extends BaseSmartDBEntity>(): string {
        return this._NET_id_CS;
    }

    public getNET_id_TN<T extends BaseSmartDBEntity>(): string {
        return this._NET_id_TN;
    }

    public getNet_id_AC_Lucid<T extends BaseSmartDBEntity>(): string {
        return this.getNET_id_CS() + strToHex(this.getNET_id_TN());
    }

    public static countDatumFields<T extends BaseSmartDBEntity>(): number {
        const conversionFunctions = getCombinedConversionFunctions(this);
        let count = 0;
        if (conversionFunctions) {
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                if (conversions.isForDatum === true) {
                    count = count + 1;
                }
            }
        }
        return count;
    }

    public isCreator<T extends BaseSmartDBEntity>(pkh: PaymentKeyHash): boolean {
        if (isNullOrBlank(pkh)) {
            throw `pkh not defined`;
        }
        return this._creator === pkh;
    }

    // #endregion class methods

    // #region datum methods

    public static mkDatumFromPlainObject<T extends BaseSmartDBEntity>(plainObject: object): Record<string, any> {
        // usado para que los campos del datum tengan las clases y tipos bien
        let datum: Record<string, any> = {};
        if (plainObject) {
            const conversionFunctions = getCombinedConversionFunctions(this);
            if (conversionFunctions) {
                const processValue = (propertyKey: string, conversions: ConversionFunctions<any>, value: any) => {
                    try {
                        let type = conversions.type as any;
                        if (conversions.fromPlainObject) {
                            value = conversions.fromPlainObject.call(this, value);
                        } else if (type.fromPlainObject) {
                            if (type.MongoModel === undefined || value !== undefined) {
                                value = type.fromPlainObject(value);
                            }
                        } else if (conversions.type === BigInt) {
                            value = deserealizeBigInt(value);
                        } else if (
                            value !== undefined &&
                            conversions.type !== Number &&
                            conversions.type !== String &&
                            conversions.type !== Boolean &&
                            conversions.type !== Object
                        ) {
                            value = new type(value);
                        }
                        return value;
                    } catch (error) {
                        throw `${this.className()} - ${propertyKey}: ${error}`;
                    }
                };
                for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                    if (conversions.isForDatum) {
                        if (plainObject.hasOwnProperty(propertyKey) === false) {
                            throw `${this.className()} - ${propertyKey}: missing in datum`;
                        }
                        let value = plainObject[propertyKey as keyof typeof plainObject] as any;
                        if (conversions.isArray === true) {
                            let array = [];
                            if (value) {
                                if (Array.isArray(value) === false) {
                                    throw `${this.className()} - ${propertyKey}: value must be an array`;
                                }
                                for (let i = 0; i < value.length; i++) {
                                    const item = processValue(propertyKey, conversions, value[i]);
                                    array.push(item);
                                }
                            }
                            value = array;
                        } else {
                            value = processValue(propertyKey, conversions, value);
                        }
                        datum[propertyKey] = value;
                        // (this as any)[propertyKey] = value;
                    }
                }
            }
        }
        return datum;
    }

    public static mkDatumFromDatumCborHex<T extends BaseSmartDBEntity>(cborHex: string): Record<string, any> {
        // crea un objeto con los tipos y clases correctos desde un cbor hex
        const datum: Record<string, any> = {};
        const conversionFunctions = getCombinedConversionFunctions(this);
        if (conversionFunctions) {
            const lucidDataForDatum: any = Data.from(cborHex);
            if (lucidDataForDatum.index === this.plutusDataIndex()) {
                
                let lucidDataForFields = [];

                if (this.plutusDataIsSubType() === false) {
                    lucidDataForFields = lucidDataForDatum.fields;
                } else {
                    const lucidDataForConstr0 = lucidDataForDatum.fields;
                    //constr para lista de campos
                    if (lucidDataForConstr0[0].index === 0) {
                        lucidDataForFields = lucidDataForConstr0[0].fields;
                    } else {
                        throw `${this.className()} - Can't get Datum - error: expected index 0 at firts level`;
                    }
                }

                const countDatumFields = this.countDatumFields();
                if (lucidDataForFields.length === countDatumFields) {
                    const processValue = (propertyKey: string, conversions: ConversionFunctions<any>, itemData: any) => {
                        try {
                            let type = conversions.type as any;
                            let value;
                            if (conversions.fromPlutusData) {
                                value = conversions.fromPlutusData.call(this, itemData);
                            } else if (type.fromPlutusData) {
                                value = type.fromPlutusData(itemData);
                            } else if (conversions.type !== Number && conversions.type !== BigInt && conversions.type !== String && conversions.type !== Boolean) {
                                //const obj = objFromLucidData(itemData)
                                value = new type(itemData);
                            } else if (conversions.type === Number) {
                                value = Number(itemData);
                            } else {
                                value = itemData;
                            }
                            return value;
                        } catch (error) {
                            throw `${this.className()} - ${propertyKey}: ${error}`;
                        }
                    };

                    let indexLucidData = 0;
                    for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                        if (conversions.isForDatum) {
                            let itemData = lucidDataForFields[indexLucidData];

                            if (conversions.isArray === true) {
                                let array = [];

                                if (itemData) {
                                    if (Array.isArray(itemData) === false) {
                                        throw `${this.className()} - ${propertyKey}: value must be an array`;
                                    }
                                    for (let i = 0; i < itemData.length; i++) {
                                        const item = processValue(propertyKey, conversions, itemData[i]);
                                        array.push(item);
                                    }
                                }
                                itemData = array;
                            } else {
                                itemData = processValue(propertyKey, conversions, itemData);
                            }
                            datum[propertyKey] = itemData;
                            indexLucidData = indexLucidData + 1;
                        }
                    }
                } else {
                    throw `${this.className()} - Can't get Datum - error: expected ${countDatumFields} fields, found ${lucidDataForFields.length}`;
                }
            } else {
                throw `${this.className()} - Can't get Datum - error: plutusDataIndex dont match`;
            }
        }
        return datum;
    }

    public static datumToLucidData<T extends BaseSmartDBEntity>(datum: any): Data {
        // convierte los campos del datum en lucidData
        let list: any[] = [];
        const conversionFunctions = getCombinedConversionFunctions(this);
        if (conversionFunctions) {
            const processValue = (propertyKey: string, conversions: ConversionFunctions<any>, value: any) => {
                try {
                    let type = conversions.type as any;
                    if (conversions.toPlutusData) {
                        value = conversions.toPlutusData.call(this, value);
                    } else if (type.toPlutusData) {
                        value = type.toPlutusData(value);
                    } else {
                        value = itemToLucidData(value, propertyKey);
                    }
                    return value;
                } catch (error) {
                    throw `${this.className()} - ${propertyKey}: ${error}`;
                }
            };
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                if (conversions.isForDatum) {
                    if (datum.hasOwnProperty(propertyKey) === false) {
                        throw `${this.className()} - ${propertyKey}: missing in datum`;
                    }
                    let value: any = datum[propertyKey];
                    const itemData = processValue(propertyKey, conversions, value);
                    list.push(itemData);
                }
            }
        }
        if (this.plutusDataIsSubType()) {
            const constrSubtypo = new Constr(0, list);
            const constrTypo = new Constr(this.plutusDataIndex(), [constrSubtypo]);
            return constrTypo;
        } else {
            const constrTypo = new Constr(this.plutusDataIndex(), list);
            return constrTypo;
        }
    }

    public static datumToCborHex<T extends BaseSmartDBEntity>(datum: Record<string, any>): string {
        // convierte los campos del datum a cbor hex
        try {
            const data = this.datumToLucidData(datum);
            const dataHex = Data.to(data);
            const plutusData = C.PlutusData.from_bytes(fromHex(dataHex));
            const cborHex = showPtrInHex(plutusData);
            return cborHex;
        } catch (error) {
            console.log(`[${this.className()}] - toDatumCborHex - Error: ${error}`);
            throw `${error}`;
        }
    }

    public getMyDatum<T extends BaseSmartDBEntity>(): Record<string, any> {
        // cobtiene objeto con todos los campos del datum
        let datum: Record<string, any> = {};
        const conversionFunctions = getCombinedConversionFunctions(this.getStatic());
        if (conversionFunctions) {
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                if (conversions.isForDatum) {
                    if (this.hasOwnProperty(propertyKey) === false) {
                        throw `${this.className()} - ${propertyKey}: missing in datum fields`;
                    }
                    datum[propertyKey] = this[propertyKey as keyof typeof this];
                }
            }
        }
        return datum;
    }

    public getMyDatumLucidData<T extends BaseSmartDBEntity>(): Data {
        // convierte los campos del datum en lucidData
        let datum = this.getMyDatum();
        return this.getStatic().datumToLucidData(datum);
    }

    public getMyDatumCborHex<T extends BaseSmartDBEntity>(): string {
        // convierte los campos del datum a cbor hex
        let datum = this.getMyDatum();
        return this.getStatic().datumToCborHex(datum);
    }

    public deleteMyDatum<T extends BaseSmartDBEntity>() {
        // elimina los campos del datum
        const conversionFunctions = getCombinedConversionFunctions(this.getStatic());
        if (conversionFunctions) {
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                if (conversions.isForDatum) {
                    if (this.hasOwnProperty(propertyKey)) {
                        this[propertyKey as keyof typeof this] = undefined as any;
                    }
                }
            }
        }
        return;
    }

    // #endregion datum methods
}
