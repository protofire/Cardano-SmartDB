
import { toJson } from "./utils.js";

//---------------------------------------------------------------

export function explainErrorTx(errorIn: any): string {
    //search if substring 'ScriptFailures' is in error
    let res = '';
    let sep = '';

    const error_In2 = `${errorIn?.info || errorIn?.message || errorIn}`;
    const error = typeof error_In2 === 'object' ? toJson(error_In2) : error_In2;

    console.error(`Error: ${error}`);

    if (error === undefined || error === null || error === '' || error === null || error === undefined || error === 'null') {
        res += sep + 'Technical problems, please try again!';
        sep = ', ';
        console.error(`Error Explained: ${res}`);
        return res;
    } else {
        if (typeof error === 'string') {
            
            if (error.includes('"Failed to fetch"')) {
                res += sep + 'The connection was lost, please try again later!';
                sep = ', ';
            }

            if (res === '' && error.includes('Failed to fetch')) {
                res += sep + 'Technical problems, please try again!';
                sep = ', ';
            }

            if (res === '' && error.includes('Cannot read properties of undefined')) {
                res += sep + 'Technical problems, please try again!';
                sep = ', ';
            }

            if (res === '' && error.includes('Insufficient input in Transaction')) {
                res += sep + 'You have no funds in your Wallet!';
                sep = ', ';
            }

            if (res === '' && error.includes('Error: 400:') && error.includes('requiredFee')) {
                res += sep + 'There was an incorrect Fee calculation, please try again later!';
                sep = ', ';
            }

            if (res === '' && error.includes('InsufficientCollateral')) {
                res +=
                    sep +
                    'You have no available UTxO with enough ADA to use as collateral! Get more ADA and try split some wallet\'s UTxO to create an UTxO that can be used as collateral.';
                sep = ', ';
            }

            if (res === '' && error.includes('Error: 400:') && error.includes('consumed')) {
                res +=
                    sep +
                    'A UTxO that is needed does not exists. It may be that another User already consumes it, please try again later! Also check if you are connected with the right wallet and network';
                sep = ', ';
            }

            if (res === '' && error.includes('missing from UTxO set')) {
                res +=
                    sep +
                    'A UTxO that is needed does not exists. It may be that another User already consumes it, please try again later! Also check if you are connected with the right wallet and network';
                sep = ', ';
            }

            if (res === '' && error.includes('BadInputsUTxO')) {
                res +=
                    sep +
                    'A UTxO that is needed does not exists. It may be that another User already consumes it, please try again later! Also check if you are connected with the right wallet and network';
                sep = ', ';
            }

            if (res === '' && error.includes('Error: 400:') && error.includes('maximumExecutionUnits')) {
                res += sep + 'Sorry, the transfer uses too many resources!';
                sep = ', ';
            }

            if (res === '' && error.includes('overspending the budget')) {
                res += sep + 'Sorry, the transfer uses too many resources!';
                sep = ', ';
            }

            if (res === '' && error.includes('ExUnitsTooBigUTxO')) {
                res += sep + 'Sorry, the transfer uses too many resources!';
                sep = ', ';
            }

            if (res === '' && error.includes('InputsExhaustedError')) {
                res +=
                    sep +
                    'You dont have enought ADAs or Tokens in your Wallet to make this Transaction. It is possible that some transfer is still in the process of being validated. please try again later!';
                sep = ', ';
            }

            if (res === '' && error.includes('Not enough ADA leftover to cover minADA')) {
                res +=
                    sep +
                    "You don't have enough ADA or UTxO available. It is possible that some transfer is still in the process of being validated. Please try Split Wallet UTxOs or try again later!";
                sep = ', ';
            }

            if (res === '' && error.includes('user declined tx')) {
                res += sep + 'You have canceled the transfer!';
                sep = ', ';
            }

            if (res === '' && error.includes('The request was refused due to lack of access - e.g. wallet disconnects.')) {
                res += sep + 'You have canceled the transfer!';
                sep = ', ';
            }

            if (res === '' && error.includes('user declined to sign tx')) {
                res += sep + 'You have canceled the transfer!';
                sep = ', ';
            }

            if (res === '' && error.includes('ExtraneousScriptWitnessesUTXOW')) {
                res += sep + 'Technical problems, please try again later!';
                sep = ', ';
            }

            if (res === '' && error.includes('ValueNotConservedUTxO')) {
                res += sep + 'Technical problems, please try again later!';
                sep = ', ';
            }

            if (res === '' && error.includes('is not valid JSON')) {
                res += sep + 'Technical problems, please try again later!';
                sep = ', ';
            }

            if (res === '' && error.includes('account changed')) {
                res += sep + 'You have changed the wallet in the dApp Connector, please reconnect with your new wallet!';
                sep = ', ';
            }

            if (res === '' && error.includes('OutsideValidityIntervalUTxO')) {
                res += sep + 'Invalid Transaction Date, please try again later!';
                sep = ', ';
            }

            if (res === '' && error.includes('invalidBefore')) {
                res += sep + 'Invalid Transaction Date, please try again later!';
                sep = ', ';
            }

            if (res === '') {
                res = error;
            }

            //console.log('Error explained: ' + res);

            return res;
        } else {
            return 'Technical problems, please try again!';
        }
    }
}

export function explainError(errorIn: any): string {
    //search if substring 'ScriptFailures' is in error
    let res = '';
    let sep = '';

    const error_In2 = `${errorIn?.info || errorIn?.message || errorIn}`;
    const error = typeof error_In2 === 'object' ? toJson(error_In2) : error_In2;

    console.log(`Error: ${error}`);

    if (error === undefined || error === null || error === '' || error === null || error === undefined || error === 'null') {
        res += sep + 'Technical problems, please try again!';
        sep = ', ';
        console.log(`Error Explained: ${res}`);
        return res;
    } else {
        if (typeof error === 'string') {
            if (error.includes('"Failed to fetch"')) {
                res += sep + 'The connection was lost, please try again later!';
                sep = ', ';
            }

            if (res === '' && error.includes('Failed to fetch')) {
                res += sep + 'Technical problems, please try again!';
                sep = ', ';
            }

            if (res === '' && error.includes('is not valid JSON')) {
                res += sep + 'Technical problems, please try again later!';
                sep = ', ';
            }

            if (res === '' && error.includes('The request was refused due to lack of access - e.g. wallet disconnects.')) {
                res += sep + 'You have canceled the connection!';
                sep = ', ';
            }

            if (res === '' && error.includes('account changed')) {
                res += sep + 'You have changed the wallet in the dApp Connector, please reconnect with your new wallet!';
                sep = ', ';
            }

            if (res === '') {
                res = error;
            }

            //console.log('Error explained: ' + res);

            return res;
        } else {
            return 'Technical problems, please try again!';
        }
    }
}
