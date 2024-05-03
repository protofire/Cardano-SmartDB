import { C, Constr, Data, fromHex } from 'lucid-cardano';
import { BaseConstructor } from '../Base/Base.Constructor';
import { getCombinedConversionFunctions, ConversionFunctions, itemToLucidData, showPtrInHex } from '../../Commons';

export class BaseTxRedeemer extends BaseConstructor {
    protected static _plutusDataIndex = 0;
    protected static _plutusDataIsSubType = true;

    // #region generic methods

    public getStatic(): typeof BaseTxRedeemer {
        return this.constructor as typeof BaseTxRedeemer;
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

    // #endregion generic methods

    // #region conversions methods

    public redeemerToLucidData(): Data {
        // // convierte los campos del datum en lucidData
        // let list: any[] = [];

        // Object.keys(this).forEach((key) => {
        //     console.log(`Key: ${key}, Value: ${(this as any)[key]}`);
        //     let value: any = (this as any)[key];
        //     const itemData: any = itemToLucidData(value, key);
        //     list.push(itemData);
        // });

        // if (this.plutusDataIsSubType()) {
        //     const constrSubtypo = new Constr(0, list);
        //     const constrTypo = new Constr(this.plutusDataIndex(), [constrSubtypo]);
        //     return constrTypo;
        // } else {
        //     const constrTypo = new Constr(this.plutusDataIndex(), list);
        //     return constrTypo;
        // }

        //---------------------------------
        let list: any[] = [];
        const redeemer = this as any;
        //---------------------------------
        const conversionFunctions = getCombinedConversionFunctions(this.getStatic());
        //---------------------------------
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
                throw `${propertyKey}: ${error}`;
            }
        };
        //---------------------------------
        //for (const [propertyKey, conversions] of conversionFunctions.entries()) {
        Object.keys(this).forEach((propertyKey) => {
            const conversions = conversionFunctions?.get(propertyKey);
            if (redeemer.hasOwnProperty(propertyKey) === false) {
                throw `${propertyKey}: missing in redeemer`;
            }
            let value: any = redeemer[propertyKey];
            let itemData: any;
            if (conversions === undefined) {
                let value: any = (this as any)[propertyKey];
                itemData = itemToLucidData(value, propertyKey);
            } else {
                itemData = processValue(propertyKey, conversions, value);
            }
            list.push(itemData);
        });
        if (this.plutusDataIsSubType()) {
            const constrSubtypo = new Constr(0, list);
            const constrTypo = new Constr(this.plutusDataIndex(), [constrSubtypo]);
            return constrTypo;
        } else {
            const constrTypo = new Constr(this.plutusDataIndex(), list);
            return constrTypo;
        }
    }

    public toCborHex(): string {
        // convierte los campos del redeemer a cbor hex
        try {
            const data = this.redeemerToLucidData();
            const dataHex = Data.to(data);
            const plutusData = C.PlutusData.from_bytes(fromHex(dataHex));
            const cborHex = showPtrInHex(plutusData);
            return cborHex;
        } catch (error) {
            console.log(`[Redeemer] - toCborHex - Error: ${error}`);
            throw `${error}`;
        }
    }

    public toHash(): string {
        try {
            const data = this.redeemerToLucidData();
            const dataHex = Data.to(data);
            const plutusData = C.PlutusData.from_bytes(fromHex(dataHex));
            const hash = C.hash_plutus_data(plutusData).to_hex();
            return hash;
        } catch (error) {
            console.log(`[Redeemer] - toHash - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static countRedeemerFields(): number {
        return Object.keys(this).length;
    }

    public static mkRedeemerFromCborHex(cborHex: string): Record<string, any> {
        // TODO: no lo probe
        // crea un objeto con los tipos y clases correctos desde un cbor hex
        const redeemer: Record<string, any> = {};
        const conversionFunctions = getCombinedConversionFunctions(this);
        if (conversionFunctions) {
            const lucidDataForDatum: any = Data.from(cborHex);
            if (lucidDataForDatum.index === this.plutusDataIndex()) {
                const lucidDataForConstr0 = lucidDataForDatum.fields;
                //constr para lista de campos
                if (lucidDataForConstr0[0].index === 0) {
                    //lista de campos del tipo de datum
                    const lucidDataForFields = lucidDataForConstr0[0].fields;
                    const countRedeemerFields = this.countRedeemerFields();
                    if (lucidDataForFields.length === countRedeemerFields) {
                        const processValue = (propertyKey: string, itemData: any, conversions?: ConversionFunctions<any>) => {
                            try {
                                let type = conversions?.type as any | undefined;
                                let value;
                                if (conversions?.fromPlutusData) {
                                    value = conversions.fromPlutusData.call(this, itemData);
                                } else if (type?.fromPlutusData) {
                                    value = type.fromPlutusData(itemData);
                                } else if (conversions?.type !== Number && conversions?.type !== BigInt && conversions?.type !== String && conversions?.type !== Boolean) {
                                    //const obj = objFromLucidData(itemData)
                                    value = new type(itemData);
                                } else if (conversions?.type === Number) {
                                    value = Number(itemData);
                                } else {
                                    value = itemData;
                                }
                                return value;
                            } catch (error) {
                                throw `[Redeemer] - ${propertyKey}: ${error}`;
                            }
                        };
                        let indexLucidData = 0;
                        Object.keys(this).forEach((propertyKey) => {
                            let itemData = lucidDataForFields[indexLucidData];
                            const conversions = conversionFunctions?.get(propertyKey);
                            if (conversions !== undefined && conversions.isArray === true) {
                                let array = [];
                                if (itemData) {
                                    if (Array.isArray(itemData) === false) {
                                        throw `[Redeemer] - ${propertyKey}: value must be an array`;
                                    }
                                    for (let i = 0; i < itemData.length; i++) {
                                        const item = processValue(propertyKey, itemData[i], conversions);
                                        array.push(item);
                                    }
                                }
                                itemData = array;
                            } else {
                                itemData = processValue(propertyKey, itemData);
                            }
                            redeemer[propertyKey] = itemData;
                            indexLucidData = indexLucidData + 1;
                        });
                    } else {
                        throw `[Redeemer] - Can't get Redeemer - error: expected ${countRedeemerFields} fields, found ${lucidDataForFields.length}`;
                    }
                } else {
                    throw `[Redeemer] - Can't get Redeemer - error: expected index 0 at firts level`;
                }
            } else {
                throw `[Redeemer] - Can't get Redeemer - error: plutusDataIndex dont match`;
            }
        }
        return redeemer;
    }

    // #endregion conversions methods
}
