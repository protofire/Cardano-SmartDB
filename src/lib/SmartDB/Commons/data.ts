// #region Lucid Data & Cbor Hex serialize and deserialize

import { Data, C, fromHex, Constr } from "lucid-cardano";
import { showPtrInHex, showData } from "../../../utils/commons/utils";

export function objToCborHex(data: any, propertyKey?: string) {
    try {
        const lucidData = objToLucidData(data, propertyKey);
        //console.log("LucidData: " + log(lucidData))
        // lucid data to hex
        const dataHex = Data.to(lucidData);
        // hex to plutus data
        const plutusData = C.PlutusData.from_bytes(fromHex(dataHex));
        // plutus data to hex
        const cborHex = showPtrInHex(plutusData);
        return cborHex;
    } catch (error) {
        console.log(`[Helpers] - objToCborHex - Data: ${showData(data)} - Error: ${error}`);
        throw `${propertyKey ? propertyKey + ' - ' : ''} ${error}`;
    }
}

export const objToLucidData = (objectValue: any, propertyKey?: string) => {
    try {
        if (objectValue === undefined) {
            throw `datum field is undefined`;
        }
        const keys = Object.keys(objectValue);
        let list: any[] = [];
        keys.forEach((key) => {
            const item = objectValue[key];
            if (key === '_plutusDataIndex' || key === '_plutusDataIsSubType') {
                return;
            }
            const itemData: any = itemToLucidData(item, key);
            list.push(itemData);
        });
        let _plutusDataIndex = 0;
        if (objectValue.plutusDataIndex && typeof objectValue.plutusDataIndex === 'function') {
            _plutusDataIndex = objectValue.plutusDataIndex();
        } else if (objectValue.hasOwnProperty('_plutusDataIndex') && objectValue._plutusDataIndex !== undefined) {
            _plutusDataIndex = objectValue._plutusDataIndex;
        }
        let _plutusDataIsSubType = false;
        if (objectValue.plutusDataIsSubType && typeof objectValue.plutusDataIsSubType === 'function') {
            _plutusDataIsSubType = objectValue.plutusDataIsSubType();
        } else if (objectValue.hasOwnProperty('_plutusDataIsSubType') && objectValue._plutusDataIsSubType !== undefined) {
            _plutusDataIsSubType = objectValue._plutusDataIsSubType;
        }
        if (_plutusDataIsSubType) {
            const constrSubtypo = new Constr(0, list);
            const constrTypo = new Constr(_plutusDataIndex, [constrSubtypo]);
            return constrTypo;
        } else {
            const constrTypo = new Constr(_plutusDataIndex, list);
            return constrTypo;
        }
    } catch (error) {
        console.log(`[Helpers] - objToLucidData - Data: ${showData(objectValue)} - Error: ${error}`);
        throw `${propertyKey ? propertyKey + ' - ' : ''} ${error}`;
    }
};

export const itemToLucidData = (itemValue: any, propertyKey?: string) => {
    try {
        if (itemValue === undefined) {
            throw `datum field is undefined`;
        }
        if (itemValue?.toPlutusData) {
            return itemValue.toPlutusData();
        } else if (
            typeof itemValue === 'bigint' ||
            typeof itemValue === 'number' ||
            (typeof itemValue === 'string' && !isNaN(parseInt(itemValue)) && itemValue.slice(-1) === 'n')
        ) {
            return BigInt(itemValue);
        } else if (typeof itemValue === 'string') {
            return itemValue;
        } else if (itemValue instanceof Constr) {
            return itemValue;
        } else if (itemValue instanceof Array) {
            let list: any[] = [];
            const keys = Object.keys(itemValue);
            keys.forEach((key) => {
                const subItem = (itemValue as any)[key];
                list.push(itemToLucidData(subItem, key));
            });
            return list;
        } else if (itemValue instanceof Map) {
            // TODO: falta convertir map, pero no uso map, asi que por ahora no lo hago
            return itemValue;
        } else if (typeof itemValue === 'object') {
            return objToLucidData(itemValue, propertyKey);
        }
        throw `Cant convert item type. Must be string, number, bigint, Array, Constr or Objetc or if a class, it must define its own toPlutusData method `;
    } catch (error) {
        console.log(`[Helpers] - toLucidData - Data: ${showData(itemValue)} - Error: ${error}`);
        throw `${propertyKey ? propertyKey + ' - ' : ''} ${error}`;
    }
};

// #endregion Lucid Data & Cbor Hex serialize and deserialize
