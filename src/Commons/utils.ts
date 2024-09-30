import { BigNumber } from 'bignumber.js';
import { createHash } from 'crypto';
import { format, utcToZonedTime } from 'date-fns-tz';
import sanitizeHtml from 'sanitize-html';
import { ADA_DECIMALS, ADA_UI } from './Constants/constants.js';
import { Decimals } from './types.js';

//----------------------------------------------------------------------

export function createErrorObject(error: unknown): Record<string, any> {
    let errorObj: Record<string, any>;

    if (error instanceof Error) {
        // Standard JavaScript errors
        errorObj = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            // Capture additional properties that may exist on the error
            ...(error as any),
        };
    } else if (typeof error === 'object' && !isEmptyObject_usingJson(error)) {
        // Handle non-empty objects (circular references handled by `toJson`)
        errorObj = {
            ...JSON.parse(toJson(error)),
        };
    } else {
        // For any other error types
        errorObj = {
            error: String(error),
        };
    }

    return errorObj;
}


//----------------------------------------------------------------------


export const isAllowedTask = (task: string, allowedTasks: string[]): boolean => {
    return allowedTasks.includes(task);
};
//----------------------------------------------------------------------

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const sleep = delay;

//----------------------------------------------------------------------

export function convertMillisToTime(millis: number): string {
    const years = Math.floor(millis / (365 * 24 * 60 * 60 * 1000));
    const yearsMillis = years * 365 * 24 * 60 * 60 * 1000;

    const days = Math.floor((millis - yearsMillis) / (24 * 60 * 60 * 1000));
    const daysMillis = days * 24 * 60 * 60 * 1000;

    const hours = Math.floor((millis - yearsMillis - daysMillis) / (60 * 60 * 1000));
    const hoursMillis = hours * 60 * 60 * 1000;

    const minutes = Math.floor((millis - yearsMillis - daysMillis - hoursMillis) / (60 * 1000));
    const minutesMillis = minutes * 60 * 1000;

    const seconds = Math.floor((millis - yearsMillis - daysMillis - hoursMillis - minutesMillis) / 1000);

    return `${years}y ${days}d ${hours}h ${minutes}m ${seconds}s`;
}

//----------------------------------------------------------------------

export function showData(data: any, swCut: boolean = true): string {
    if (!Array.isArray(data) && isObject(data) && isEmptyObject(data, true)) {
        return '{}';
    }
    const str = swCut ? toJson(data).slice(0, 256) : toJson(data);
    if (str.includes('[object Object]')) {
        console.log('TODO FIXME [object Object]');
        return '{}';
    }
    return str;
}

//----------------------------------------------------------------------

export function getPostgreSQLTableName(baseName: string): string {
    return baseName
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

export function getMongoTableName(baseName: string): string {
    baseName = baseName.toLowerCase();
    // Check if the class name ends with 'y' (but not 'ay', 'ey', 'iy', 'oy', 'uy' which typically just add 's')
    if (baseName.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(baseName.charAt(baseName.length - 2))) {
        // Replace 'y' with 'ies'
        return baseName.substring(0, baseName.length - 1) + 'ies';
    } else if (!baseName.endsWith('s')) {
        // If it does not end with 's', simply add 's'
        return baseName + 's';
    }
    // If it ends with 's', return as is (assuming it's already plural)
    return baseName;
}

//----------------------------------------------------------------------

export const sanitizeForDatabase = (input: any): any => {
    const allowedMongoDBOperators = new Set([
        '$eq',
        '$gt',
        '$gte',
        '$in',
        '$lt',
        '$lte',
        '$ne',
        '$nin',
        '$or',
        '$and',
        '$not',
        '$nor',
        '$exists',
        '$type',
        '$expr',
        '$jsonSchema',
        '$mod',
        '$regex',
        '$text',
        '$where',
        '$geoWithin',
        '$geoIntersects',
        '$near',
        '$nearSphere',
        '$all',
        '$elemMatch',
        '$size',
        '$bitsAllClear',
        '$bitsAllSet',
        '$bitsAnyClear',
        '$bitsAnySet',
        // Add more operators as needed
    ]);

    if (Array.isArray(input)) {
        // If input is an array, recursively sanitize its elements
        return input.map((element) => sanitizeForDatabase(element));
    } else if (typeof input === 'object' && input !== null) {
        // If input is an object and not null, recursively sanitize its properties
        const sanitizedObject: any = {};
        for (const [key, value] of Object.entries(input)) {
            // Only allow properties that don't start with '$', or are in the allowed list
            if (!key.startsWith('$') || allowedMongoDBOperators.has(key)) {
                sanitizedObject[key] = sanitizeForDatabase(value);
            }
        }
        return sanitizedObject;
    } else if (typeof input === 'string') {
        //TODO: agregar allowed tags si se necesita, o el encoding
        // Trim and sanitize strings, then encode
        const sanitizedString = sanitizeHtml(input.trim(), {
            allowedTags: [], // Specify allowed tags if any, or leave empty to allow no tags
            allowedAttributes: {}, // Specify allowed attributes if any, or leave empty to allow no attributes
        });
        return sanitizedString;
        // return he.encode(sanitizedString);
    }
    // Otherwise, keep the value as is
    return input;
};

//----------------------------------------------------------------------

export function setAndLoosePrecision(r: bigint, n: number): bigint {
    const num = BigInt(10) ** BigInt(n);
    const numerator = r * BigInt(10) ** BigInt(n);
    return numerator / num;
}

export function setAndLoosePrecision1e6GetOnlyNumerator(r: BigNumber): bigint {
    const scaleFactor = new BigNumber(1_000_000);
    const scaled = r.times(scaleFactor);
    const integerPart = truncateBigNumber(scaled);
    return integerPart;
}

export function truncateBigNumber(r: BigNumber): bigint {
    const string = r.toString();
    const integerPart = string.includes('.') ? string.split('.')[0] : string;
    return BigInt(integerPart);
}

export function getBigIntx1e6(value: bigint | undefined): bigint | undefined {
    if (value === undefined) return undefined;
    return value / 1_000_000n;
    // return BigInt(Math.floor(Number(value) / 1_000_000))
}

export function getNumberx1e6(value: bigint | number | undefined): number | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== 'number' && value !== undefined) {
        value = Number(value);
    }
    return value / 1_000_000;
}

export function getInputValueFromSmallUnitPriceLovelace1xe6(smallUnitPriceLovelace1xe6: bigint | number | undefined, decimals: Decimals): bigint | undefined {
    if (smallUnitPriceLovelace1xe6 === undefined) return undefined;
    if (typeof smallUnitPriceLovelace1xe6 !== 'number' && smallUnitPriceLovelace1xe6 !== undefined) {
        smallUnitPriceLovelace1xe6 = Number(smallUnitPriceLovelace1xe6);
    }
    const extra1e6Decimales = 6;
    const inputDecimales = extra1e6Decimales + ADA_DECIMALS - decimals;
    // const reverseSmallUnitPriceLovelace = smallUnitPriceLovelace1xe6 / 10 ** extra1e6Decimales;
    // console.log(`reverseSmallUnitPriceLovelace: ${reverseSmallUnitPriceLovelace}`);
    // const reverseUnitPriceLovelace = reverseSmallUnitPriceLovelace * 10 ** decimals;
    // console.log(`reverseUnitPriceLovelace: ${reverseUnitPriceLovelace}`);
    // const reverseUnitPriceADA = reverseUnitPriceLovelace / 10 ** ADA_DECIMALS;
    // console.log(`reverseUnitPriceADA: ${reverseUnitPriceADA}`);
    // const reverseInputValue = reverseUnitPriceADA * 10 ** inputDecimales;
    // console.log(`reverseInputValue: ${reverseInputValue}`);
    const reverseInputValue1Step = BigInt(Math.floor(smallUnitPriceLovelace1xe6 * 10 ** (inputDecimales - ADA_DECIMALS + decimals - extra1e6Decimales)));
    // console.log(`reverseInputValue1Step: ${reverseInputValue1Step}`);
    return reverseInputValue1Step;
}

export function getSmallUnitPriceLovelace1xe6FromInputValue(inputValue: bigint | number | undefined, decimals: Decimals): bigint | undefined {
    if (inputValue === undefined) return undefined;
    if (typeof inputValue !== 'number' && inputValue !== undefined) {
        inputValue = Number(inputValue);
    }
    const extra1e6Decimales = 6;
    const inputDecimales = extra1e6Decimales + ADA_DECIMALS - decimals;
    // const unitPriceADA = inputValue / 10 ** inputDecimales;
    // console.log(`unitPriceADA: ${unitPriceADA}`);
    // const unitPriceLovelace = unitPriceADA * 10 ** ADA_DECIMALS;
    // console.log(`unitPriceLovelace: ${unitPriceLovelace}`);
    // const smallUnitPriceLovelace = unitPriceLovelace / 10 ** decimals!;
    // console.log(`smallUnitPriceLovelace: ${smallUnitPriceLovelace}`);
    // const smallUnitPriceLovelace1xe6 = (Math.floor(smallUnitPriceLovelace * 10 **extra1e6Decimales));
    // console.log(`smallUnitPriceLovelace1xe6: ${smallUnitPriceLovelace1xe6}`);
    const smallUnitPriceLovelace1xe61Step = BigInt(Math.floor(inputValue * 10 ** (-inputDecimales + ADA_DECIMALS - decimals + extra1e6Decimales)));
    // console.log(`smallUnitPriceLovelace1xe61Step: ${smallUnitPriceLovelace1xe61Step}`);
    return smallUnitPriceLovelace1xe61Step;
}

//----------------------------------------------------------------------

export function getInstanceVariables(instance: any): string[] {
    return Object.keys(instance).filter((key) => typeof instance[key] !== 'function');
}

export function getFieldsAndTypes(obj: any): { [key: string]: any } {
    const fieldTypes: { [key: string]: any } = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            fieldTypes[key] = typeof obj[key];
        }
    }

    return fieldTypes;
}

//----------------------------------------------------------------------

export function capitalizeFirstLetters(sentence: string | undefined): string | undefined {
    if (sentence === undefined) {
        return undefined;
    }
    return sentence.replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase());
}

//----------------------------------------------------------------------

export async function executeFunction(fn: Function, value1?: any, value2?: any): Promise<any> {
    if (isPromiseFunction(fn)) {
        if (fn.length === 2) {
            return await fn(value1, value2);
        } else if (fn.length === 1) {
            return await fn(value1);
        } else {
            return await fn();
        }
    } else {
        if (fn.length === 2) {
            return fn(value1, value2);
        } else if (fn.length === 1) {
            return fn(value1);
        } else {
            return fn();
        }
    }
}

//----------------------------------------------------------------------

export function isPromiseFunction(fn: Function): boolean {
    return fn.constructor && fn.constructor.name === 'AsyncFunction';
}

//----------------------------------------------------------------------

export function isFrontEndEnvironment() {
    if (typeof window !== 'undefined') {
        // console.log('This code is running in the browser (frontend)');
        return true;
    } else if (typeof process !== 'undefined') {
        // console.log('This code is running in Node.js (backend)');
        return false;
    }
    return false;
}

//----------------------------------------------------------------------

export function createQueryURLString(obj?: Record<string, any>): string {
    if (obj === undefined) {
        return '';
    }
    const query = Object.entries(obj)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

    return `?${query}`;
}

//----------------------------------------------------------------------

export const generateRandomHash = () => {
    const timestamp = Date.now().toString();
    const dataWithTime = timestamp;
    const hash = createHash('sha256');
    hash.update(dataWithTime);
    return hash.digest('hex');
};

//----------------------------------------------------------------------

export function formatTokenAmountMock(
    amount: bigint | number | undefined,
    CS: string,
    TN_Hex?: string,
    showDecimals: Decimals = 0,
    swRoundWithLetter: boolean = false,
    showAtLeastDecimals: Decimals = 0,
    decimalsInBigUnit: Decimals = showDecimals
): string {
    return formatTokenAmount(amount, CS, TN_Hex, showDecimals, swRoundWithLetter, showAtLeastDecimals, decimalsInBigUnit);
}

export function formatTokenAmount(
    amount: bigint | number | undefined,
    CS: string,
    TN_Hex?: string,
    showDecimals: Decimals = 0,
    swRoundWithLetter: boolean = false,
    showAtLeastDecimals: Decimals = 0,
    decimalsInBigUnit: Decimals = showDecimals
): string {
    if (typeof amount !== 'number' && amount !== undefined) {
        amount = Number(amount);
    }
    if (CS === ADA_UI || CS === '' || CS === 'lovelace') {
        if (amount === undefined) {
            return `... ${ADA_UI}`;
        }
        return formatAmountWithUnit(amount, ADA_DECIMALS, ADA_UI, swRoundWithLetter, showAtLeastDecimals, ADA_DECIMALS);
    } else if (TN_Hex !== undefined) {
        if (amount === undefined) {
            return `... ${hexToStr(TN_Hex)}`;
        }
        return formatAmountWithUnit(amount, showDecimals, hexToStr(TN_Hex), swRoundWithLetter, showAtLeastDecimals, decimalsInBigUnit);
    }
    return '';
}

export function formatAmountWithUnit(
    amount: bigint | number,
    showDecimals: Decimals = 0,
    unit: string = '',
    swRoundWithLetter: boolean = false,
    showAtLeastDecimals: Decimals = 0,
    decimalsInBigUnit: Decimals = showDecimals
) {
    //-------------
    if (typeof amount !== 'number') {
        amount = Number(amount);
    }
    //-------------
    let roundedValueWithDecimals = amount;
    //-------------
    // if (showDecimals !== decimalsInBigUnit) {
    //-------------
    // si esta seteando estos valores diferentes, aqui calculo el valor real de la unidad grande
    // y mas abajo, si no esta seteado rounbdWithLetter, lo vuelvo a multiplicar, esta vez por el valor de showDecimals, por que a su vez el formatAmount lo va a dividir por ese valor
    const potDecimalsInBigUnit = Math.pow(10, decimalsInBigUnit);
    const realValueInBiGUnit = amount / potDecimalsInBigUnit;
    //-------------
    roundedValueWithDecimals = realValueInBiGUnit;
    // }
    //-------------
    if (swRoundWithLetter === true) {
        //-------------
        let decimals_: Decimals = showAtLeastDecimals;
        //-------------
        if (amount < Math.pow(10, decimalsInBigUnit - showAtLeastDecimals) && amount > 0) {
            //-------------
            if (unit !== '' && (unit === ADA_UI || decimalsInBigUnit === 6)) {
                //-------------
                // eso significa que el numero es menor que el menor valor que se va a mostrar con estos decimales
                // resto dos, por que quiero igual seguir usando el otro valor, que
                //-------------
                if (unit === ADA_UI) {
                    unit = 'love';
                } else {
                    if (decimalsInBigUnit === 6) {
                        unit = 'μ' + unit;
                    } else {
                        // esto por ahora no entra nunca... en el futuro si, pero no es facil para el usuario
                        unit = `x10-${decimalsInBigUnit}` + unit;
                    }
                }
                //-------------
                roundedValueWithDecimals = amount;
                //-------------
            } else {
                decimals_ = showDecimals;
            }
        }
        //-------------
        if (!unit.startsWith(' ') && unit !== '') {
            unit = ' ' + unit;
        }
        //-------------
        if (roundedValueWithDecimals >= 1e18) {
            roundedValueWithDecimals /= 1e18;
            unit = 'QT' + unit;
        } else if (roundedValueWithDecimals >= 1e15) {
            roundedValueWithDecimals /= 1e15;
            unit = 'Q' + unit;
        } else if (roundedValueWithDecimals >= 1e12) {
            roundedValueWithDecimals /= 1e12;
            unit = 'T' + unit;
        } else if (roundedValueWithDecimals >= 1e9) {
            roundedValueWithDecimals /= 1e9;
            unit = 'B' + unit;
        } else if (roundedValueWithDecimals >= 1e6) {
            roundedValueWithDecimals /= 1e6;
            unit = 'M' + unit;
        } else if (roundedValueWithDecimals >= 1e3) {
            roundedValueWithDecimals /= 1e3;
            unit = 'K' + unit;
        }
        //-------------
        if (roundedValueWithDecimals === Math.floor(roundedValueWithDecimals)) {
            decimals_ = 0;
        }
        //-------------
        const potShowDecimals = Math.pow(10, decimals_);
        //-------------
        return formatAmount(roundedValueWithDecimals * potShowDecimals, decimals_, 0) + unit;
        //-------------
    } else {
        //-------------
        if (!unit.startsWith(' ') && unit !== '') {
            unit = ' ' + unit;
        }
        //-------------
        // if (showDecimals !== decimalsInBigUnit) {
        const potShowDecimals = Math.pow(10, showDecimals);
        roundedValueWithDecimals = roundedValueWithDecimals * potShowDecimals;
        // }
        //-------------
        return formatAmount(roundedValueWithDecimals, showDecimals, showAtLeastDecimals) + unit;
        //-------------
    }
}

export function formatAmount(amount: BigInt | number, showDecimals: Decimals = 0, showAtLeastDecimals: Decimals = 0) {
    //-------------
    if (typeof amount !== 'number') {
        amount = Number(amount);
    }
    //----------------
    const pot = Math.pow(10, showDecimals);
    let result = Math.floor((amount / pot) * pot) / pot;
    //----------------
    if (showAtLeastDecimals > showDecimals) {
        showAtLeastDecimals = showDecimals;
    }
    //----------------
    let strConDecimals = result.toLocaleString('en-US', { minimumFractionDigits: showAtLeastDecimals, maximumFractionDigits: showDecimals });
    //----------------
    let posDec = strConDecimals.indexOf('.');
    if (posDec !== -1) {
        //delete trailing zeros
        strConDecimals = strConDecimals.replace(/0*$/, '');
        strConDecimals = strConDecimals.replace(/\.$/, '');
    }
    //----------------
    // posDec = strConDecimals.indexOf('.');
    // if (posDec === -1 && showAtLeastDecimals > 0) {
    //     strConDecimals = strConDecimals + '.' + '0'.repeat(showAtLeastDecimals);
    // }
    //----------------
    // return (amount / pot) + ' - ' + strConDecimals1 + ' - ' + strConDecimals;
    return strConDecimals;
}

export function formatPercentage(
    amount: bigint | number,
    showDecimals: Decimals = 0,
    swRoundWithLetter: boolean = false,
    showAtLeastDecimals: Decimals = 0,
    decimalsInBigUnit: Decimals = showDecimals
) {
    return formatAmountWithUnit(amount, showDecimals, '', swRoundWithLetter, showAtLeastDecimals, decimalsInBigUnit) + '%';
}

//----------------------------------------------------------------------

export function convertUTCDateToLocalDate(date: Date, format_: string = 'yyyy-MM-dd HH:mm:ss', timeZone?: string): string {
    if (timeZone === undefined) timeZone = getUserTimeZone();
    const zonedDate = utcToZonedTime(date, timeZone);
    return format(zonedDate, format_, { timeZone });
}

export function getUserTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatPOXISTime(time: bigint, format: string = 'yyyy-MM-dd HH:mm:ss', timeZone?: string): string {
    return formatDate(new Date(Number(time)), format, timeZone);
}

export function formatDate(date: Date | undefined, format: string = 'yyyy-MM-dd HH:mm:ss', timeZone?: string): string {
    // return date.toLocaleString('en-US', {
    //     year: 'numeric',
    //     month: '2-digit',
    //     day: '2-digit',
    //     hour: '2-digit',
    //     minute: '2-digit',
    //     second: '2-digit',
    // });
    if (date === undefined) {
        return '';
    }
    return convertUTCDateToLocalDate(date, format, timeZone);
}

export function startOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
}

export function endOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
}

export function daysBetweenDates(startDate: Date, endDate: Date): number {
    const oneDay = 1000 * 60 * 60 * 24; // milliseconds in one day
    const diffInTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffInTime / oneDay);
}

//----------------------------------------------------------------------

export function intToLetter(number: number): string {
    return String.fromCharCode(65 + number);
}
export function letterToInt(letter: string): number {
    return letter.charCodeAt(0) - 65;
}

//----------------------------------------------------------------------

export const copyToClipboard = (str: string) => {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(str);
    return Promise.reject('The Clipboard API is not available.');
};

//----------------------------------------------------------------------

//for converting String into Hex representation. It is used for converting the TokenName into Hex
export function strToHex(str: string) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += str.charCodeAt(i).toString(16);
    }
    return result;
}

//for converting Hex into String
export function hexToStr(hexStr: string) {
    const bytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i !== bytes.length; i++) {
        bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
    }
    return new TextDecoder().decode(bytes);
}

//----------------------------------------------------------------------

// #region toByteString

export function intToUint8Array(x: bigint): Uint8Array {
    if (x < 0) {
        return concatUint8Arrays([new Uint8Array([45]), intToUint8Array(-x)]); // 45 is ASCII code for '-'
    }
    if (x / 10n === 0n) {
        return digitToUint8Array(x);
    }
    return concatUint8Arrays([intToUint8Array(x / 10n), digitToUint8Array(x % 10n)]);

    function digitToUint8Array(d: bigint): Uint8Array {
        // 48 is ASCII code for '0'
        return new Uint8Array([Number(d) + 48]);
    }
}

export function stringToUint8Array(s: string): Uint8Array {
    return new TextEncoder().encode(s);
}

export function stringHexToUint8Array(hexStr: string): Uint8Array {
    const bytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i < hexStr.length; i += 2) {
        bytes[i / 2] = parseInt(hexStr.substr(i, 2), 16);
    }
    return bytes;
}

export function bytesUint8ArraToStringHex(bytes: Uint8Array): string {
    const b = Buffer.from(bytes).toString('hex');
    return b;
}

export function bytesUint8ArraToStringHex2(bytes: Uint8Array): string {
    const toHexString = bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
    return toHexString;
}

//for converting Hex String to byte array. It is used in sha256 calculation.
export function stringHexToNumberArray(hexStr: string): number[] {
    let bytes = [];
    for (let c = 0; c < hexStr.length; c += 2) {
        bytes.push(parseInt(hexStr.substr(c, 2), 16));
    }
    return bytes;
}

// Convert a byte array to a hex string
export function numberArrayToStringHex(bytes: number[]): string {
    let hex = [];
    for (let i = 0; i < bytes.length; i++) {
        let current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xf).toString(16));
    }
    return hex.join('');
}

// Helper function to concatenate Uint8Array
export function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    let totalLength = 0;
    arrays.forEach((arr) => (totalLength += arr.length));
    const result = new Uint8Array(totalLength);
    let offset = 0;
    arrays.forEach((arr) => {
        result.set(arr, offset);
        offset += arr.length;
    });
    return result;
}

// #endregion toByteString

//----------------------------------------------------------------------

//for showing content of pointers
export function showPtrInHex(ptr: any): string {
    return Buffer.from(ptr.to_bytes(), 'utf8').toString('hex');
}

//----------------------------------------------------------------------

//for calculating sha256S hash from hex string
export function sha256HexStr(hexStr: string) {
    //const bytesStr = stringHexToNumberArray (hexStr)
    //const res = createHash('sha256').update(bytesStr).digest('hex');
    const res = createHash('sha256').update(hexStr, 'hex').digest('hex');
    return res;
}

//----------------------------------------------------------------------

//for printing pretty any object
export function toJson(data: any, space?: string | number): string {
    const getCircularReplacer = () => {
        const parents: any[] = []; // Track parent objects
        const parentKeys: string[] = []; // Track corresponding keys

        return function (this: any, key: string, value: any) {
            if (isObject(value) && !isEmptyObject(value, false)) {
                const index = parents.indexOf(this);
                if (index !== -1) {
                    parents.splice(index + 1);
                    parentKeys.splice(index, Infinity, key);
                } else {
                    parents.push(this);
                    parentKeys.push(key);
                }
                if (parents.includes(value)) {
                    return 'Object Circular Reference';
                }
            }

            if (typeof value === 'bigint') {
                return value.toString();
            }
            return value;
        };
    };
    if (data !== null && data !== undefined) {
        let json = JSON.stringify(data, getCircularReplacer(), space);

        if (json === '{}' && data.toString !== undefined && !isObject(data)) {
            json = data.toString();
        }

        const jsonreplace = json.replace(/"(-?\d+)n"/g, (_, a) => a);
        return jsonreplace;
    } else {
        return '{}';
    }
}

//----------------------------------------------------------------------

export function searchValueInArray(array: string | any[], value: any) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === value) {
            return true;
        }
    }
    return false;
}

//remove value from array
export function removeValueFromArray(array: any[], value: any) {
    const res: any[] = [];

    for (let i = 0; i < array.length; i++) {
        if (array[i] !== value) {
            res.push(array[i]);
        }
    }

    return res;
}

//search key in object
export function searchKeyInObject(obj: any, key: string) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        if (key === keys[i]) {
            return true;
        }
    }

    if (obj.hasOwnProperty(key)) {
        return true;
    } else {
        return false;
    }
}

//search and get key in object
export function searchAndGetKeyInObject(obj: any, key: string) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        if (key === keys[i]) {
            return obj[key];
        }
    }
    if (obj.hasOwnProperty(key)) {
        return obj[key];
    } else {
        return undefined;
    }
}

//----------------------------------------------------------------------

export function htmlEscape(str: string) {
    return str.replace(/&/g, '&amp').replace(/'/g, '&apos').replace(/"/g, '&quot').replace(/>/g, '&gt').replace(/</g, '&lt');
}

// The opposite function:
export function htmlUnescape(str: string) {
    return str.replace(/&amp/g, '&').replace(/&apos/g, "'").replace(/&quot/g, '"').replace(/&gt/g, '>').replace(/&lt/g, '<');
}

//----------------------------------------------------------------------

export function isEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
        return true;
    }

    if (isObject(obj1) && isObject(obj2)) {
        const props1 = Object.getOwnPropertyNames(obj1);
        const props2 = Object.getOwnPropertyNames(obj2);

        if (props1.length !== props2.length) {
            return false;
        }

        for (const prop of props1) {
            const val1 = obj1[prop];
            const val2 = obj2[prop];
            const areObjects = isObject(val1) && isObject(val2);
            const areArrays = Array.isArray(val1) && Array.isArray(val2);

            if ((areObjects || areArrays) && !isEqual(val1, val2)) {
                return false;
            } else if (!areObjects && !areArrays && val1 !== val2) {
                return false;
            }
        }

        return true;
    } else if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) {
            return false;
        }

        for (let i = 0; i < obj1.length; i++) {
            if (!isEqual(obj1[i], obj2[i])) {
                return false;
            }
        }

        return true;
    }

    return false;
}

export function isEmptyObject(obj: any, swOnlyDefined: boolean = false) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key) && ((swOnlyDefined && obj[key] !== undefined) || !swOnlyDefined)) {
            return false;
        }
    }
    return true;
}

export function isEmptyObject_usingJson(obj: any) {
    if (toJson(obj) === '{}') {
        return true;
    }
    return false;
}

export function isString(object: any): object is string {
    return typeof object === 'string';
}

export function isObject(object: any) {
    return object !== null && typeof object === 'object' && object.hasOwnProperty !== undefined;
}

export const isNullOrBlank = (value: string | undefined): boolean => {
    return value === undefined || value === null || value.trim() === '';
};

export const isArrayEmpty = (value: any[]): boolean => {
    return value === undefined || value === null || value.length === 0;
};

//----------------------------------------------------------------------
// not for instances
// only for class constructors
export function isSubclassOf(Derived: any, Base: any): boolean {
    let proto = Derived;
    while (proto) {
        // console.log(`proto === Base: ${proto === Base} - proto.name ${proto.name} === Base.name ${Base.name}: ${proto.name === Base.name} && ${Object.getPrototypeOf(proto)?.name} === ${Object.getPrototypeOf(Base)?.name}: ${Object.getPrototypeOf(proto)?.name === Object.getPrototypeOf(Base)?.name}`);
        if (proto === Base) {
            return true;
        }
        if (proto.name === Base.name && Object.getPrototypeOf(proto)?.name === Object.getPrototypeOf(Base)?.name) {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}
//----------------------------------------------------------------------
