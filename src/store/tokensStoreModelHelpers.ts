import { Decimals } from "../Commons/types.js";
import { IUseTokensStore } from "./types.js";

export function showADA_Amount(tokensStore: IUseTokensStore, amount: bigint | number | undefined, swRounded: boolean = false, showDecimals: Decimals = 0): string {
    return tokensStore.showTokenWithAmount(amount, '', '', swRounded, showDecimals);
}

export function showADA_Amount_NotRounded(tokensStore: IUseTokensStore, amount: bigint | number | undefined): string {
    return showADA_Amount(tokensStore, amount, false);
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
    swRounded: boolean = false,
    showDecimals: Decimals = 0
): string {
    return tokensStore.showTokenWithAmount(amount, CS, TN_Hex, swRounded, showDecimals);
}

export function showToken_Amount_NotRounded(tokensStore: IUseTokensStore, amount: bigint | number | undefined, CS: string, TN_Hex: string): string {
    return showToken_Amount(tokensStore, amount, CS, TN_Hex, false);
}

export function showToken_Amount_Rounded(tokensStore: IUseTokensStore, amount: bigint | number | undefined, CS: string, TN_Hex: string): string {
    return showToken_Amount(tokensStore, amount, CS, TN_Hex, true, 2);
}

//----------------------------------------------------------------------

export function showToken_Price(tokensStore: IUseTokensStore, CS: string, TN_Hex: string, swRounded: boolean = false, showDecimals: Decimals = 0): string {
    return tokensStore.showTokenPrice(CS, TN_Hex, swRounded, showDecimals);
}

export function showToken_Price_NotRounded(tokensStore: IUseTokensStore, CS: string, TN_Hex: string): string {
    return showToken_Price(tokensStore, CS, TN_Hex, false);
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
    swRounded: boolean = false,
    showDecimals: Decimals = 0,
    decimalsInAmount: Decimals = 0
): string {
    return tokensStore.showTokenPriceMultipliedByAmount(amount, CS, TN_Hex, swRounded, showDecimals, decimalsInAmount);
}

export function showToken_Price_MultipliedByAmount_NotRounded(
    tokensStore: IUseTokensStore,
    amount: bigint | number | undefined,
    CS: string,
    TN_Hex: string,
    decimalsInAmount: Decimals = 0
): string {
    return showToken_Price_MultipliedByAmount(tokensStore, amount, CS, TN_Hex, false, undefined, decimalsInAmount);
}

export function showToken_Price_MultipliedByAmount_Rounded(
    tokensStore: IUseTokensStore,
    amount: bigint | number | undefined,
    CS: string,
    TN_Hex: string,
    decimalsInAmount: Decimals = 0
): string {
    return showToken_Price_MultipliedByAmount(tokensStore, amount, CS, TN_Hex, true, 2, decimalsInAmount);
}

//----------------------------------------------------------------------
