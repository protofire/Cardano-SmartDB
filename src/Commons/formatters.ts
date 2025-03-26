import { TOKEN_ADA_TICKER } from './Constants/constants.js';
import { Decimals } from './types.js';
import { convertUTCDateToLocalDate, hexToStr, isNullOrBlank } from './utils.js';

//----------------------------------------------------------------------
export function formatNumberRounded(amount: string): string {
    const numericString = amount.replace(/,/g, '');
    const value = Number(numericString);
    if (isNaN(value)) {
        return '0.00';
    }
    const absValue = Math.abs(value);
    let formattedValue: number;
    let suffix = '';
    if (absValue >= 1e9) {
        formattedValue = value / 1e9;
        suffix = 'B';
    } else if (absValue >= 1e6) {
        formattedValue = value / 1e6;
        suffix = 'M';
    } else if (absValue >= 1e3) {
        formattedValue = value / 1e3;
        suffix = 'K';
    } else {
        formattedValue = value;
    }
    return `${formattedValue.toFixed(2)}${suffix}`;
}
//----------------------------------------------------------------------
export function formatPercentage(
    amount: bigint | number,
    showDecimals: Decimals = 0,
    swRoundWithLetter: boolean = false,
    decimalsInBaseUnit: Decimals = 0,
    showAtLeastDecimals: Decimals = 0
) {
    return formatAmountWithUnit(amount, '', showDecimals, swRoundWithLetter, decimalsInBaseUnit, showAtLeastDecimals) + '%';
}

export function formatAmountWithUnit(
    amount: bigint | number | undefined,
    unit: string | undefined, //def ''
    showDecimals: Decimals | undefined, // def 0
    swRoundWithLetter: boolean = false,
    decimalsInBaseUnit: Decimals = 0, //def 0
    showAtLeastDecimals: Decimals = 0
) {
    //-------------
    if (amount === undefined || unit === undefined || showDecimals === undefined) {
        return `...`;
    }
    if (typeof amount !== 'number') {
        amount = Number(amount);
    }
    //-------------
    let isNegative = amount < 0;
    if (isNegative) {
        amount = -amount;
    }
    //-------------
    // calculates real value in base unit
    const pot = Math.pow(10, decimalsInBaseUnit);
    let amountInBaseUnit = amount / pot;
    let amountInBaseUnitRounded = Math.round(amountInBaseUnit);
    // console.log('amountInBaseUnit:', amountInBaseUnit);
    // console.log('amountInBaseUnitRounded:', amountInBaseUnitRounded);
    //-------------
    if (swRoundWithLetter === true) {
        //-------------
        if (amountInBaseUnitRounded >= 1) {
            //-------------
            let unitModifier = '';
            //-------------
            if (Math.round(amountInBaseUnit / 1e18) > 1) {
                amountInBaseUnit /= 1e18;
                unitModifier += 'QT';
            } else if (Math.round(amountInBaseUnit / 1e15) > 1) {
                amountInBaseUnit /= 1e15;
                unitModifier += 'Q';
            } else if (Math.round(amountInBaseUnit / 1e12) > 1) {
                amountInBaseUnit /= 1e12;
                unitModifier += 'T';
            } else if (Math.round(amountInBaseUnit / 1e9) > 1) {
                amountInBaseUnit /= 1e9;
                unitModifier += 'B';
            } else if (Math.round(amountInBaseUnit / 1e4) > 1) {
                amountInBaseUnit /= 1e6;
                unitModifier += 'M';
            } else if (Math.round(amountInBaseUnit / 1e3) > 1) {
                amountInBaseUnit /= 1e3;
                unitModifier += 'K';
            }
            if (!unit.startsWith(' ') && unit !== '') {
                unit = ' ' + unit;
            }
            //-------------
            return (isNegative ? `-` : ``) + formatAmount(amountInBaseUnit, showDecimals, 0, showAtLeastDecimals) + unitModifier + unit;
        } else {
            if (!unit.startsWith(' ') && unit !== '') {
                unit = ' ' + unit;
            }
            return `${isNegative ? '-' : ''}${formatSmallNumber(amountInBaseUnit, showDecimals, showAtLeastDecimals)}${unit}`;
        }
    } else {
        //-------------
        if (!unit.startsWith(' ') && unit !== '') {
            unit = ' ' + unit;
        }
        //-------------
        return (isNegative ? `-` : ``) + formatAmount(amountInBaseUnit, showDecimals, 0, showAtLeastDecimals) + unit;
        //-------------
    }
}
export function formatAmount(amount: BigInt | number | undefined, showDecimals: Decimals | undefined, decimalsInAmount: Decimals = 0, showAtLeastDecimals: Decimals = 0) {
    //-------------
    if (amount === undefined || showDecimals === undefined) {
        return `...`;
    }
    if (typeof amount !== 'number') {
        amount = Number(amount);
    }
    //----------------
    const potDecimalsInAmount = Math.pow(10, decimalsInAmount);
    let amountInBaseUnit = amount / potDecimalsInAmount;
    //----------------
    if (showAtLeastDecimals > showDecimals) {
        showAtLeastDecimals = showDecimals;
    }
    //----------------
    // NOTE: no hace falta redondear, lo hace la funcion de acuerdo a la cantidad de decimales a mostrar
    let strConDecimals = amountInBaseUnit.toLocaleString('en-US', { minimumFractionDigits: showAtLeastDecimals, maximumFractionDigits: showDecimals });
    //----------------
    let posDec = strConDecimals.indexOf('.');
    if (posDec !== -1) {
        //delete trailing zeros
        strConDecimals = strConDecimals.replace(/0*$/, '');
        strConDecimals = strConDecimals.replace(/\.$/, '');
    }
    //----------------
    return strConDecimals;
}

export function formatSmallNumber(amount: number, showDecimals: number = 0, showAtLeastDecimals: number = 0): string {
    // Define subscript characters for numbers 0-9
    const subscriptNums = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

    // Convert the number to a string to process its decimal part
    const strInitial = amount.toString();
    const [, afterDotInitial = ''] = strInitial.split('.'); // Split into integer and decimal parts

    let totalContinuosZeros = 0; // Total count of consecutive zeros after the decimal
    let currentZeros = 0; // Count of zeros in the current streak

    // Count groups of consecutive zeros in the decimal part
    for (let i = 0; i < afterDotInitial.length; i++) {
        if (afterDotInitial[i] === '0') {
            currentZeros++; // Increment the current streak of zeros
        } else {
            if (currentZeros > 1) {
                // If the streak has more than one zero, add the streak minus 1 to the total
                totalContinuosZeros += currentZeros - 1;
            }
            currentZeros = 0; // Reset the streak if a non-zero is encountered
        }
    }

    // Handle trailing zeros in the decimal part
    if (currentZeros > 1) {
        totalContinuosZeros += currentZeros; // Add remaining zeros to the total count
    }

    // Round the number to accommodate necessary decimals and grouped zeros
    const roundedStr = amount.toFixed(showDecimals + totalContinuosZeros);
    const [beforeDot, afterDot = ''] = roundedStr.split('.'); // Split the rounded number into integer and decimal parts

    let formattedParts: string[] = []; // Array to store formatted decimal parts
    currentZeros = 0; // Reset current zero streak
    let digitsShown = 0; // Number of digits currently added to the formatted output
    let i = 0; // Pointer to iterate through the decimal part

    // Process the decimal part and format the output
    while (i < afterDot.length && digitsShown < showDecimals) {
        if (afterDot[i] === '0') {
            currentZeros++; // Count consecutive zeros
        } else {
            if (currentZeros > 1) {
                // Convert a streak of zeros into a subscript if more than one
                formattedParts.push(subscriptNums[currentZeros]);
                digitsShown += 1; // Increment digits shown
                currentZeros = 0; // Reset zero streak
            } else if (currentZeros === 1) {
                // Add a single zero as a normal '0'
                formattedParts.push('0');
                digitsShown += 1;
                currentZeros = 0; // Reset zero streak
            }
            // Add the current non-zero digit to the formatted parts
            if (digitsShown < showDecimals) {
                formattedParts.push(afterDot[i]);
                digitsShown += 1;
            }
        }
        i++;
    }

    // Remove trailing zeros and subscripts from the formatted parts
    if (formattedParts.length > 0) {
        while (
            formattedParts[formattedParts.length - 1] === '0' || // Remove normal zeros
            subscriptNums.some((n) => n === formattedParts[formattedParts.length - 1]) // Remove subscripted zeros
        ) {
            formattedParts.pop(); // Remove the trailing element
            digitsShown--; // Decrease the count of digits shown
        }
    }

    // Ensure there are enough decimals based on showAtLeastDecimals
    if (showAtLeastDecimals > showDecimals) {
        showAtLeastDecimals = showDecimals;
    }

    while (digitsShown < showAtLeastDecimals) {
        formattedParts.push('0'); // Add normal zeros to meet the minimum requirement
        digitsShown++;
    }

    // Return the final formatted result
    if (formattedParts.length === 0) {
        return beforeDot; // No decimal part, return just the integer part
    } else {
        return `${beforeDot}.${formattedParts.join('')}`; // Combine integer and formatted decimal parts
    }
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

export function formatHash(txHash: string) {
    return isNullOrBlank(txHash) ? '' : txHash.slice(0, 4) + '...' + txHash.slice(txHash.length - 4);
}

export function formatCurrencySymbol(CS: string) {
    if (CS === '' || CS === 'lovelace') return TOKEN_ADA_TICKER;
    return CS.slice(0, 4) + '...' + CS.slice(CS.length - 4);
}
// export function formatTokenName(TN_Str: string, ADA_Str = TOKEN_ADA_SYMBOL) {
//     if (TN_Str === '') return ADA_Str;
//     if (TN_Str.length > 30) {
//         return TN_Str.slice(0, 27) + '...';
//     }
//     return TN_Str;
// }

export function formatTN_Hex(TN_Hex: string) {
    // ticker = isNullOrBlank(ticker) ? TN_Str : ticker;
    // return formatTokenName(ticker!, TOKEN_ADA_TICKER);
    if (TN_Hex === '') return TOKEN_ADA_TICKER;
    const TN_Str = hexToStr(TN_Hex);
    if (TN_Str.length > 30) {
        return TN_Str.slice(0, 27) + '...';
    }
    return TN_Str;
}

export function formatTicker(ticker?: string) {
    // ticker = isNullOrBlank(ticker) ? TN_Str : ticker;
    // return formatTokenName(ticker!, TOKEN_ADA_TICKER);
    if (ticker === undefined) {
        return '...';
    }
    if (ticker === '') return TOKEN_ADA_TICKER;
    if (ticker.length > 30) {
        return ticker.slice(0, 27) + '...';
    }
    return ticker;
}

export function formatAddress(address: string, isSmall: boolean = true) {
    if (isSmall) {
        return isNullOrBlank(address) ? '' : address.length < 5 + 3 + 4 ? address : address.slice(0, 5) + '...' + address.slice(address.length - 4);
    } else {
        return isNullOrBlank(address) ? '' : address.length < 20 + 3 + 10 ? address : address.slice(0, 20) + '...' + address.slice(address.length - 10);
    }
}

export function formatUTxO(txHash: string, outputIndex: number) {
    return `${formatHash(txHash)}#${outputIndex}`;
}
