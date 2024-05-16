import { Decimals } from './types.js';
import { IUseTokensStore } from '../store/types.js';

//----------------------------------------------------------------------

export function showADA_Amount(tokensStore: IUseTokensStore, amount: bigint | number | undefined, swRoundWithLetter: boolean = false, showAtLeastDecimals: Decimals = 0): string {
    return tokensStore.showTokenWithAmount(amount, '', '', swRoundWithLetter, showAtLeastDecimals);
}

export function showADA_Amount_NotRounded(tokensStore: IUseTokensStore, amount: bigint | number | undefined): string {
    return showADA_Amount(tokensStore, amount, false, 2);
}

export function showADA_Amount_Rounded(tokensStore: IUseTokensStore, amount: bigint | number | undefined): string {
    return showADA_Amount(tokensStore, amount, true, 2);
}
//----------------------------------------------------------------------

export function showToken_Amount(
    tokensStore: IUseTokensStore,
    amount: bigint | number | undefined,
    CS: string,
    TN_Hex: string,
    swRoundWithLetter: boolean = false,
    showAtLeastDecimals: Decimals = 0
): string {
    return tokensStore.showTokenWithAmount(amount, CS, TN_Hex, swRoundWithLetter, showAtLeastDecimals);
}

export function showToken_Amount_NotRounded(tokensStore: IUseTokensStore, amount: bigint | number | undefined, CS: string, TN_Hex: string): string {
    return showToken_Amount(tokensStore, amount, CS, TN_Hex, false, 2);
}

export function showToken_Amount_Rounded(tokensStore: IUseTokensStore, amount: bigint | number | undefined, CS: string, TN_Hex: string): string {
    return showToken_Amount(tokensStore, amount, CS, TN_Hex, true, 2);
}
//----------------------------------------------------------------------

export function showToken_Price(
    tokensStore: IUseTokensStore,
    CS: string,
    TN_Hex: string,
    swRoundWithLetter: boolean = false,
    showAtLeastDecimals: Decimals = 0
): string {
    return tokensStore.showTokenPrice(CS, TN_Hex, swRoundWithLetter, showAtLeastDecimals);
}

export function showToken_Price_NotRounded(tokensStore: IUseTokensStore, CS: string, TN_Hex: string): string {
    return showToken_Price(tokensStore, CS, TN_Hex, false, 2);
}

export function showToken_Price_Rounded(tokensStore: IUseTokensStore, CS: string, TN_Hex: string): string {
    return showToken_Price(tokensStore, CS, TN_Hex, true, 2);
}
//----------------------------------------------------------------------

export function showToken_Price_MultipliedByAmount(
    tokensStore: IUseTokensStore,
    amount: bigint | number | undefined,
    CS: string,
    TN_Hex: string,
    swRoundWithLetter: boolean = false,
    showAtLeastDecimals: Decimals = 0,
    divideAfterMultiplyBy?: bigint | number
): string {
    return tokensStore.showTokenPriceMultipliedByAmount(amount, CS, TN_Hex, swRoundWithLetter, showAtLeastDecimals, divideAfterMultiplyBy);
}

export function showToken_Price_MultipliedByAmount_NotRounded(tokensStore: IUseTokensStore, amount: bigint | number | undefined, CS: string, TN_Hex: string, divideAfterMultiplyBy?: bigint | number): string {
    return showToken_Price_MultipliedByAmount(tokensStore, amount, CS, TN_Hex, false, 2, divideAfterMultiplyBy);
}

export function showToken_Price_MultipliedByAmount_Rounded(tokensStore: IUseTokensStore, amount: bigint | number | undefined, CS: string, TN_Hex: string, divideAfterMultiplyBy?: bigint | number): string {
    return showToken_Price_MultipliedByAmount(tokensStore, amount, CS, TN_Hex, true, 2, divideAfterMultiplyBy);
}


//----------------------------------------------------------------------

