import BigNumber from 'bignumber.js';
import { createHash } from 'crypto';
import { utcToZonedTime, format } from 'date-fns-tz';
import { Decimals } from './types';

//----------------------------------------------------------------------

export const isAllowedTask = (task: string, allowedTasks: string[]): boolean => {
    return allowedTasks.includes(task);
};
//----------------------------------------------------------------------

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const sleep = delay

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

export const sanitizeForDatabase = (input: any): any => {
    const allowedMongoDBOperators = new Set([
        '$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin', '$or', '$and', '$not', '$nor',
        '$exists', '$type', '$expr', '$jsonSchema', '$mod', '$regex', '$text', '$where', 
        '$geoWithin', '$geoIntersects', '$near', '$nearSphere', '$all', '$elemMatch', '$size',
        '$bitsAllClear', '$bitsAllSet', '$bitsAnyClear', '$bitsAnySet',
        // Add more operators as needed
    ]);
    
    if (Array.isArray(input)) {
        // If input is an array, recursively sanitize its elements
        return input.map(element => sanitizeForDatabase(element));
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
        // Trim strings
        return input.trim();
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
        console.log('This code is running in the browser (frontend)');
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

export function isString(object: any): object is string {
    return typeof object === 'string';
}

export function isObject(object: any) {
    return object !== null && typeof object === 'object' && object.hasOwnProperty !== undefined;
}

export const isNullOrBlank = (value: string | undefined): boolean => {
    return value === undefined || value.trim() === '';
};

//----------------------------------------------------------------------
// not for instances
// only for class constructors
export function isSubclassOf(Derived: any, Base: any): boolean {
    let proto = Object.getPrototypeOf(Derived);
    while (proto) {
        if (proto === Base) {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}
//----------------------------------------------------------------------


export function isValidUrl(url: string): boolean {
    // Regular expression to check if the URL is absolute and starts with http://, https://, or ipfs://
    const absoluteUrlPattern = /^(https?:\/\/|ipfs:\/\/).+/;
    // Check if the URL is an absolute URL, starts with a leading slash, or is an IPFS URL
    return absoluteUrlPattern.test(url) || url.startsWith('/');
}

export function getUrlForImage(url: string): string {
    if (isValidUrl(url)) {
        return url.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${url.slice(7)}` : url;
    } else {
        return '';
    }
}

export function isValidHexColor(color: string): boolean {
    // Regular expression to validate hex color (3 or 6 digits, with or without '#')
    const hexColorPattern = /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;
    return hexColorPattern.test(color);
}
