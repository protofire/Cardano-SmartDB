import { BigNumber } from 'bignumber.js';
import { createHash } from 'crypto';
import { format, utcToZonedTime } from 'date-fns-tz';
import sanitizeHtml from 'sanitize-html';
import { PRICEx1e6_DECIMALS, TOKEN_ADA_DECIMALS, TOKEN_ADA_MULTIPLIER } from './Constants/constants.js';
import { Decimals } from './types.js';
import { TxSignBuilder } from '@lucid-evolution/lucid';

//----------------------------------------------------------------------

// export function createErrorObject(error: unknown): Record<string, any> {
//     let errorObj: Record<string, any>;

//     if (error instanceof Error) {
//         // Standard JavaScript errors
//         errorObj = {
//             name: error.name,
//             message: error.message,
//             stack: error.stack,
//             // Capture additional properties that may exist on the error
//             ...(error as any),
//         };
//     } else if (typeof error === 'object' && !isEmptyObject_usingJson(error)) {
//         // Handle non-empty objects (circular references handled by `toJson`)
//         errorObj = {
//             ...JSON.parse(toJson(error)),
//         };
//     } else {
//         // For any other error types
//         errorObj = {
//             error: String(error),
//         };
//     }

//     return errorObj;
// }

//----------------------------------------------------------------------

export const isAllowedTask = (task: string, allowedTasks: string[]): boolean => {
    return allowedTasks.includes(task);
};
//----------------------------------------------------------------------

export const sleep = (ms: number) => {
    console.log(`[SLEEP] Sleeping for ${ms}ms...`);
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export function calculateBackoffDelay(retryDelayMs: number, retries: number): number {
    const cappedRetries = Math.min(retries, 20);
    const baseDelay = cappedRetries * Math.random();
    const result = retryDelayMs * baseDelay;
    console.log(`[SLEEP] Backoff - retryDelayMs: ${retryDelayMs} - retries: ${retries} - delay: ${result}ms`);
    return result;
}

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

    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'a', 'img', 'video', 'iframe', 'div', 'span']; // Agrega las etiquetas permitidas según Quill
    const allowedAttributes = {
        a: ['href', 'target', 'rel'], // Atributos para enlaces
        img: ['src', 'alt', 'width', 'height'], // Atributos para imágenes
        video: ['src', 'width', 'height', 'controls'], // Atributos para videos
        iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'], // Atributos para iframes
        '*': ['style'], // Permitir atributos 'style' para cualquier etiqueta
    };

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
            allowedTags, // Specify allowed tags if any, or leave empty to allow no tags
            allowedAttributes, // Specify allowed attributes if any, or leave empty to allow no attributes
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

export function setAndLoosePrecision1e6GetOnlyNumeratorUsingBigInt(r: bigint): bigint {
    const SCALE_FACTOR = 1_000_000n;
    // Scale the numerator by 1e6, then perform integer division
    return r * SCALE_FACTOR;
}

export function setAndLoosePrecision1e6GetOnlyNumerator(r: BigNumber): bigint {
    const scaleFactor = new BigNumber(1_000_000);
    const scaled = r.times(scaleFactor);
    const integerPart = truncateBigNumber(scaled);
    return integerPart;
}

export function truncateBigNumber(r: BigNumber): bigint {
    // Direct truncation without relying on string conversion
    const result = BigInt(r.integerValue(BigNumber.ROUND_FLOOR).toString());
    // console.log('truncateBigNumber:', result);
    return result;
}

// export function truncateBigNumber(r: BigNumber): bigint {
//     const string = r.toString();
//     const integerPart = string.includes('.') ? string.split('.')[0] : string;
//     return BigInt(integerPart);
// }

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

export function getNumberxBPx1e3(value: bigint | number | undefined): number | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== 'number' && value !== undefined) {
        value = Number(value);
    }
    return value / 10_000_000;
}

//----------------------------------------------------------------------

/**
 * Scaling and Rounding Functions
 *
 * These functions replicate the precise arithmetic scaling and rounding logic
 * from Haskell. The primary use cases involve financial operations and token
 * calculations where precision is critical.
 *
 * Scaling Mechanism:
 * - Numbers are scaled up to enable fractional arithmetic using integers.
 *   - Scaling factors: 1e6, BPx1e3, 1e2.
 * - Rounding Up: Round away from zero.
 * - Rounding Down: Round towards zero (truncate decimals).
 */

/**
 * Generic function to multiply two numbers, scale, and round up.
 */
export function multiply_By_Scaled_And_RoundUp(amount: bigint, number_scaled: bigint, base: bigint): bigint {
    const multiplied = amount * number_scaled;
    const remainder = multiplied % base;
    const result = multiplied / base;

    return remainder > 0n ? result + 1n : result;
}

/**
 * Generic function to multiply two numbers, scale, and round down.
 */
export function multiply_By_Scaled_And_RoundDown(amount: bigint, number_scaled: bigint, base: bigint): bigint {
    const multiplied = amount * number_scaled;
    return multiplied / base; // BigInt division truncates (rounds down).
}

/**
 * Generic function to divide two numbers with scaling, handling rounding down.
 * Uses pure remainder-based calculation without assuming division behavior.
 */
export function divide_By_Scaled_And_RoundDownSafe(amount: bigint, number_scaled: bigint, base: bigint): bigint {
    if (number_scaled === 0n) {
        throw `divide_By_Scaled_And_RoundDownSafe - Division by zero`;
    }
    const rawAmount = amount * base;
    // Get absolute values for calculation
    const absRawAmount = rawAmount >= 0n ? rawAmount : -rawAmount;
    const absNumberScaled = number_scaled >= 0n ? number_scaled : -number_scaled;
    // Calculate remainder first
    const remainder = absRawAmount % absNumberScaled;
    // Calculate rounded down result by subtracting remainder
    const roundedResult = (absRawAmount - remainder) / absNumberScaled;
    // Determine sign: if inputs have same sign, result is positive
    const isPositive = (rawAmount >= 0n && number_scaled >= 0n) || (rawAmount < 0n && number_scaled < 0n);
    return isPositive ? roundedResult : -roundedResult;
}

/**
 * Generic function to divide two numbers with scaling, handling rounding up.
 * Uses pure remainder-based calculation without assuming division behavior.
 */
export function divide_By_Scaled_And_RoundUpSafe(amount: bigint, number_scaled: bigint, base: bigint): bigint {
    if (number_scaled === 0n) {
        throw `divide_By_Scaled_And_RoundUpSafe - Division by zero`;
    }
    const rawAmount = amount * base;
    // Get absolute values for calculation
    const absRawAmount = rawAmount >= 0n ? rawAmount : -rawAmount;
    const absNumberScaled = number_scaled >= 0n ? number_scaled : -number_scaled;
    // Calculate remainder first
    const remainder = absRawAmount % absNumberScaled;
    // Calculate result adding the appropriate amount if there's a remainder
    const roundedResult = remainder === 0n ? absRawAmount / absNumberScaled : (absRawAmount - remainder + absNumberScaled) / absNumberScaled;
    // Determine sign: if inputs have same sign, result is positive
    const isPositive = (rawAmount >= 0n && number_scaled >= 0n) || (rawAmount < 0n && number_scaled < 0n);

    return isPositive ? roundedResult : -roundedResult;
}

/**
 * Multiply by 1e6 and round up.
 */
export function multiply_By_Scaled_1e6_And_RoundUp(amount: bigint, number_1x06: bigint): bigint {
    return multiply_By_Scaled_And_RoundUp(amount, number_1x06, 1_000_000n);
}

/**
 * Multiply by 1e6 and round down.
 */
export function multiply_By_Scaled_1e6_And_RoundDown(amount: bigint, number_1x06: bigint): bigint {
    return multiply_By_Scaled_And_RoundDown(amount, number_1x06, 1_000_000n);
}

/**
 * Divide by 1e6 and round down safely.
 */
export function divide_By_Scaled_1e6_And_RoundDownSafe(amount: bigint, number_1e6: bigint): bigint {
    return divide_By_Scaled_And_RoundDownSafe(amount, number_1e6, 1_000_000n);
}

/**
 * Divide by 1e6 and round up safely.
 */
export function divide_By_Scaled_1e6_And_RoundUpSafe(amount: bigint, number_1e6: bigint): bigint {
    return divide_By_Scaled_And_RoundUpSafe(amount, number_1e6, 1_000_000n);
}

/**
 * Multiply by BPx1e3 (Basis Points x1e3) and round up.
 */
export function multiply_By_Scaled_BPx1e3_And_RoundUp(amount: bigint, number_BPx1e3: bigint): bigint {
    return multiply_By_Scaled_And_RoundUp(amount, number_BPx1e3, 10_000_000n);
}

/**
 * Multiply by BPx1e3 (Basis Points x1e3) and round down.
 */
export function multiply_By_Scaled_BPx1e3_And_RoundDown(amount: bigint, number_BPx1e3: bigint): bigint {
    return multiply_By_Scaled_And_RoundDown(amount, number_BPx1e3, 10_000_000n);
}

/**
 * Divide by BPx1e3 and round down safely.
 */
export function divide_By_Scaled_BPx1e3_And_RoundDownSafe(amount: bigint, number_BPx1e3: bigint): bigint {
    return divide_By_Scaled_And_RoundDownSafe(amount, number_BPx1e3, 10_000_000n);
}

/**
 * Multiply by 1e2 and round up.
 */
export function multiply_By_Scaled_1e2_And_RoundUp(amount: bigint, number_1e2: bigint): bigint {
    return multiply_By_Scaled_And_RoundUp(amount, number_1e2, 100n);
}

/**
 * Multiply by 1e2 and round down.
 */
export function multiply_By_Scaled_1e2_And_RoundDown(amount: bigint, number_1e2: bigint): bigint {
    return multiply_By_Scaled_And_RoundDown(amount, number_1e2, 100n);
}

/**
 * Divide by 1e2 and round down safely.
 */
export function divide_By_Scaled_1e2_And_RoundDownSafe(amount: bigint, number_1e2: bigint): bigint {
    return divide_By_Scaled_And_RoundDownSafe(amount, number_1e2, 100n);
}

//----------------------------------------------------------------------

export function getInputValueFromSmallUnitPriceLovelace1xe6(smallUnitPriceLovelace1xe6: bigint | number | undefined, decimals: Decimals): bigint | undefined {
    if (smallUnitPriceLovelace1xe6 === undefined) return undefined;
    if (typeof smallUnitPriceLovelace1xe6 !== 'number' && smallUnitPriceLovelace1xe6 !== undefined) {
        smallUnitPriceLovelace1xe6 = Number(smallUnitPriceLovelace1xe6);
    }
    const inputDecimales = PRICEx1e6_DECIMALS + TOKEN_ADA_DECIMALS - decimals;
    // const reverseSmallUnitPriceLovelace = smallUnitPriceLovelace1xe6 / 10 ** PRICEx1e6_DECIMALS;
    // console.log(`reverseSmallUnitPriceLovelace: ${reverseSmallUnitPriceLovelace}`);
    // const reverseUnitPriceLovelace = reverseSmallUnitPriceLovelace * 10 ** decimals;
    // console.log(`reverseUnitPriceLovelace: ${reverseUnitPriceLovelace}`);
    // const reverseUnitPriceADA = reverseUnitPriceLovelace / 10 ** ADA_DECIMALS;
    // console.log(`reverseUnitPriceADA: ${reverseUnitPriceADA}`);
    // const reverseInputValue = reverseUnitPriceADA * 10 ** inputDecimales;
    // console.log(`reverseInputValue: ${reverseInputValue}`);
    const reverseInputValue1Step = BigInt(Math.floor(smallUnitPriceLovelace1xe6 * 10 ** (inputDecimales - TOKEN_ADA_DECIMALS + decimals - PRICEx1e6_DECIMALS)));
    // console.log(`reverseInputValue1Step: ${reverseInputValue1Step}`);
    return reverseInputValue1Step;
}

export function getSmallUnitPriceLovelace1xe6FromInputValue(inputValue: bigint | number | undefined, decimals: Decimals): bigint | undefined {
    if (inputValue === undefined) return undefined;
    if (typeof inputValue !== 'number' && inputValue !== undefined) {
        inputValue = Number(inputValue);
    }
    const inputDecimales = PRICEx1e6_DECIMALS + TOKEN_ADA_DECIMALS - decimals;
    // const unitPriceADA = inputValue / 10 ** inputDecimales;
    // console.log(`unitPriceADA: ${unitPriceADA}`);
    // const unitPriceLovelace = unitPriceADA * 10 ** ADA_DECIMALS;
    // console.log(`unitPriceLovelace: ${unitPriceLovelace}`);
    // const smallUnitPriceLovelace = unitPriceLovelace / 10 ** decimals!;
    // console.log(`smallUnitPriceLovelace: ${smallUnitPriceLovelace}`);
    // const smallUnitPriceLovelace1xe6 = (Math.floor(smallUnitPriceLovelace * 10 **PRICEx1e6_DECIMALS));
    // console.log(`smallUnitPriceLovelace1xe6: ${smallUnitPriceLovelace1xe6}`);
    const smallUnitPriceLovelace1xe61Step = BigInt(Math.floor(inputValue * 10 ** (-inputDecimales + TOKEN_ADA_DECIMALS - decimals + PRICEx1e6_DECIMALS)));
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

export function convertUTCDateToLocalDate(date: Date, format_: string = 'yyyy-MM-dd HH:mm:ss', timeZone?: string): string {
    if (timeZone === undefined) timeZone = getUserTimeZone();
    const zonedDate = utcToZonedTime(date, timeZone);
    return format(zonedDate, format_, { timeZone });
}

export function getUserTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function startOfDay(date: Date): Date {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
    return start;
}

export function endOfDay(date: Date): Date {
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
    return end;
}

export function daysBetweenDates(startDate: Date, endDate: Date): number {
    const oneDay = 1000 * 60 * 60 * 24; // milliseconds in one day
    const diffInTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffInTime / oneDay);
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

export function subDays(date: Date, days: number): Date {
    return addDays(date, -days);
}

export function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getUTCDate() === date2.getUTCDate() && date1.getUTCMonth() === date2.getUTCMonth() && date1.getUTCFullYear() === date2.getUTCFullYear();
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
export function hexToStr(hexStr?: string) {
    if (hexStr === '' || hexStr === undefined) {
        return '';
    }

    if (isValidHex(hexStr) === false) {
        return '';
    }

    const bytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i !== bytes.length; i++) {
        bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
    }
    return new TextDecoder().decode(bytes);
}

export const isValidHex = (hex: string): boolean => {
    // Ensure the string length is even
    if (hex.length % 2 !== 0) {
        return false;
    }
    // Regular expression to match valid hexadecimal characters
    const hexRegex = /^[0-9A-Fa-f]+$/;
    return hexRegex.test(hex);
};

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

// //for showing content of pointers
// export function showPtrInHex(ptr: any): string {
//     return Buffer.from(ptr.to_bytes(), 'utf8').toString('hex');
// }

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
export function toJson(data: any, space?: string | number, swOnlyDefined: boolean = false, swOnlyOwnProperties: boolean = true): string {
    const getCircularReplacer = () => {
        const parents: any[] = []; // Track parent objects
        const parentKeys: string[] = []; // Track corresponding keys

        return function (this: any, key: string, value: any) {
            // Handle bigint conversion
            if (typeof value === 'bigint') {
                return value.toString();
            }

            // Handle primitive values directly
            if (!isObject(value) || value === null) {
                return value;
            }

            // Handle Error objects
            if (value instanceof Error) {
                return {
                    name: value.name,
                    message: value.message,
                    stack: value.stack,
                    ...Object.getOwnPropertyNames(value).reduce((acc, key) => {
                        acc[key] = (value as any)[key]; // Include custom properties
                        return acc;
                    }, {} as Record<string, any>),
                };
            }

            if (isObject(value) && !isEmptyObject(value, swOnlyDefined, swOnlyOwnProperties)) {
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

export function isEmptyObject(obj: any, swOnlyDefined: boolean = false, swOnlyOwnProperties: boolean = true) {
    if (!isObject(obj)) return true;

    const result = !Object.entries(obj).some(
        ([key, value]) =>
            ((swOnlyOwnProperties && (Object.hasOwn(obj, key) || obj.hasOwnProperty(key))) || !swOnlyOwnProperties) && ((swOnlyDefined && value !== undefined) || !swOnlyDefined)
    );

    return result;

    // for (let key in obj) {
    //     if (((swOnlyOwnProperties && obj.hasOwnProperty(key)) || !swOnlyOwnProperties) && ((swOnlyDefined && obj[key] !== undefined) || !swOnlyDefined)) {
    //         return false;
    //     }
    // }

    // return true;
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

export const isNullOrBlank = (value: string | undefined | null): boolean => {
    return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
};

export const isArrayEmpty = (value: any[]): boolean => {
    return value === undefined || value === null || value.length === 0;
};

//----------------------------------------------------------------------

// NOTE: check other implementations

// not for instances
// only for class constructors

// export function isSubclassOf_Legacy(Derived: any, Base: any): boolean {
//     let proto = Object.getPrototypeOf(Derived);
//     while (proto) {
//         if (proto === Base) {
//             return true;
//         }
//         proto = Object.getPrototypeOf(proto);
//     }
//     return false;
// }

// export function isSubclassOf_Legacy2(Derived: any, Base: any): boolean {
//     let proto = Derived;
//     while (proto) {
//         // console.log(`proto === Base: ${proto === Base} - proto.name ${proto.name} === Base.name ${Base.name}: ${proto.name === Base.name} && ${Object.getPrototypeOf(proto)?.name} === ${Object.getPrototypeOf(Base)?.name}: ${Object.getPrototypeOf(proto)?.name === Object.getPrototypeOf(Base)?.name}`);
//         if (proto === Base) {
//             return true;
//         }
//         if (proto.name === Base.name && Object.getPrototypeOf(proto)?.name === Object.getPrototypeOf(Base)?.name) {
//             return true;
//         }
//         proto = Object.getPrototypeOf(proto);
//     }
//     return false;
// }

export function isSubclassOf_Legacy(Derived: any, Base: any): boolean {
    let proto = Object.getPrototypeOf(Derived);
    while (proto) {
        if (proto === Base) {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}

export function isSubclassOf(Derived: any, Base: any): boolean {
    let proto = Derived;
    while (proto) {
        // Si coincide con la clase base, devuelve true
        if (isSameClass(proto, Base)) {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}

export function isSameClass(ClassA: any, ClassB: any): boolean {
    let protoA = ClassA;
    let protoB = ClassB;

    while (protoA && protoB) {
        if (protoA.name !== protoB.name || (protoA._className && protoB._className && protoA._className !== protoB._className)) {
            return false;
        }

        protoA = Object.getPrototypeOf(protoA);
        protoB = Object.getPrototypeOf(protoB);

        // Si llegamos a Object sin encontrar diferencias, es la misma clase
        if (protoA === Object && protoB === Object) {
            return true;
        }

        if (protoA === null && protoB === null) {
            return true;
        }
    }

    return false;
}

//----------------------------------------------------------------------

export const generateRandomColor = (): string => {
    const randomColor = Math.floor(Math.random() * 16777215)
        .toString(16)
        .toUpperCase();
    return `#${randomColor.padStart(6, '0')}`;
};

//----------------------------------------------------------------------

export function getTxRedeemersDetailsAndResources(tx: TxSignBuilder): {
    redeemers: {
        INDEX: number;
        TAG: 'Spend' | 'Mint' | 'Cert' | 'Reward' | 'Voting' | 'Proposing';
        MEM: number;
        CPU: number;
        CBOR: string;
    }[];
    redeemersLogs: {
        INDEX: number;
        TAG: 'Spend' | 'Mint' | 'Cert' | 'Reward' | 'Voting' | 'Proposing';
        MEM: number;
        CPU: number;
    }[];
    tx: {
        SIZE: number;
        MEM: number;
        CPU: number;
        FEE: number;
    }[];
} {
    const resultRedeemers: {
        INDEX: number;
        TAG: 'Spend' | 'Mint' | 'Cert' | 'Reward' | 'Voting' | 'Proposing';
        MEM: number;
        CPU: number;
        CBOR: string;
    }[] = [];

    const resultRedeemersLogs: {
        INDEX: number;
        TAG: 'Spend' | 'Mint' | 'Cert' | 'Reward' | 'Voting' | 'Proposing';
        MEM: number;
        CPU: number;
    }[] = [];

    const resultTx: {
        SIZE: number;
        MEM: number;
        CPU: number;
        FEE: number;
    }[] = [];

    const CMLTx = tx.toTransaction();

    const fee = parseInt(CMLTx.body().fee().toString());
    const txSize = CMLTx.to_cbor_bytes().length;

    const redeemers = CMLTx.witness_set().redeemers();

    var mem_ = 0;
    var cpu_ = 0;

    const TransactionTypes = [
        'Spend', // 0
        'Mint', // 1
        'Cert', // 2
        'Reward', // 3
        'Voting', // 4
        'Proposing', // 5
    ] as const;

    if (redeemers) {
        const arrLegacyRedeemer = redeemers?.as_arr_legacy_redeemer();
        if (arrLegacyRedeemer) {
            for (let i = 0; i < arrLegacyRedeemer.len(); i++) {
                const redeemer = arrLegacyRedeemer.get(i);
                const mem = parseInt(redeemer.ex_units().mem().toString());
                const cpu = parseInt(redeemer.ex_units().steps().toString());
                cpu_ += cpu;
                mem_ += mem;
                resultRedeemers.push({
                    INDEX: Number(redeemer.index().toString()),
                    TAG: TransactionTypes[redeemer.tag()],
                    MEM: mem / 1_000_000,
                    CPU: cpu / 1_000_000_000,
                    CBOR: redeemer.data().to_canonical_cbor_hex(),
                });
                resultRedeemersLogs.push({ INDEX: Number(redeemer.index().toString()), TAG: TransactionTypes[redeemer.tag()], MEM: mem / 1_000_000, CPU: cpu / 1_000_000_000 });
            }
        }
        const mapRedeemerKeyToRedeemerVal = redeemers?.as_map_redeemer_key_to_redeemer_val();
        if (mapRedeemerKeyToRedeemerVal) {
            const keys = mapRedeemerKeyToRedeemerVal.keys();
            for (let i = 0; i < (keys.len() || 0); i++) {
                const key = keys.get(i);
                const value = mapRedeemerKeyToRedeemerVal.get(key);
                if (value !== undefined) {
                    const mem = parseInt(value.ex_units().mem().toString());
                    const cpu = parseInt(value.ex_units().steps().toString());
                    cpu_ += cpu;
                    mem_ += mem;
                    resultRedeemers.push({
                        INDEX: Number(key.index().toString()),
                        TAG: TransactionTypes[key.tag()],
                        MEM: mem / 1_000_000,
                        CPU: cpu / 1_000_000_000,
                        CBOR: key.to_canonical_cbor_hex(),
                    });
                    resultRedeemersLogs.push({ INDEX: Number(key.index().toString()), TAG: TransactionTypes[key.tag()], MEM: mem / 1_000_000, CPU: cpu / 1_000_000_000 });
                }
            }
        }
    }

    resultTx.push({
        SIZE: txSize,
        MEM: mem_ / 1_000_000,
        CPU: cpu_ / 1_000_000_000,
        FEE: fee / TOKEN_ADA_MULTIPLIER,
    });

    return { redeemers: resultRedeemers, redeemersLogs: resultRedeemersLogs, tx: resultTx };
}

//---------------------------------------------------------------------

export function checkIfUserCanceled(error: any): boolean {
    const errorList = [
        'User canceled',
        'user declined sign tx',
        'User denied account authorization',
        'User rejected the request',
        'User rejected the transaction',
        'User denied transaction signature',
        'Transaction rejected',
        'Transaction aborted',
    ];
    let errorString = toJson(error);
    return errorList.some((msg) => errorString.includes(msg));
}

//---------------------------------------------------------------------
