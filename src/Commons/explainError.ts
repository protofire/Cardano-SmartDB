
//---------------------------------------------------------------

import { toJson } from "./utils.js";

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
            if (error.includes('"JN"')) {
                res += sep + 'From just error';
                sep = ', ';
            }
            if (error.includes('"GD"')) {
                res += sep + 'Error getting Datum';
                sep = ', ';
            }
            if (error.includes('"MF"') || error === 'MF') {
                res += sep + "Can't find Master information. Maybe the Master didn't fund or already claimed";
                sep = ', ';
            }
            if (error.includes('"MFGB"')) {
                res += sep + 'Master already claimed his Funds';
                sep = ', ';
            }
            if (error.includes('"TOKENS"')) {
                res += sep + "Can't create enough Value";
                sep = ', ';
            }
            if (error.includes('"INT"')) {
                res += sep + "Can't find adequate Interest Rate";
                sep = ', ';
            }

            if (error.includes('"IE"')) {
                res += sep + "Can't find Input being validated";
                sep = ', ';
            }
            if (error.includes('"IE2"')) {
                res += sep + 'Wrong Input being validated';
                sep = ', ';
            }
            if (error.includes('"INVOP"')) {
                res += sep + 'Invalid operation';
                sep = ', ';
            }

            if (error.includes('"IPD"')) {
                res += sep + "Can't find input with PoolDatum";
                sep = ', ';
            }
            if (error.includes('"INRPD"')) {
                res += sep + "Can't find normal or reference input with PoolDatum";
                sep = ', ';
            }
            if (error.includes('"IRPD"')) {
                res += sep + "Can't find reference input with PoolDatum";
                sep = ', ';
            }
            if (error.includes('"IRPDE"')) {
                res += sep + "Can't use reference input with PoolDatum";
                sep = ', ';
            }

            if (error.includes('"IFDS"')) {
                res += sep + "Can't find inputs with FundDatums";
                sep = ', ';
            }
            if (error.includes('"IFD"')) {
                res += sep + "Can't find input with FundDatum";
                sep = ', ';
            }
            if (error.includes('"ISDS"')) {
                res += sep + "Can't find inputs with ScriptDatums";
                sep = ', ';
            }
            if (error.includes('"IUD"')) {
                res += sep + "Can't find input with UserDatum";
                sep = ', ';
            }

            if (error.includes('"OPD"')) {
                res += sep + "Can't find output with PoolDatum";
                sep = ', ';
            }
            if (error.includes('"OFD"')) {
                res += sep + "Can't find output with FundDatum";
                sep = ', ';
            }
            if (error.includes('"OFDS"')) {
                res += sep + "Can't find outputs with FundDatums";
                sep = ', ';
            }
            if (error.includes('"OUD"')) {
                res += sep + "Can't find output with UserDatum";
                sep = ', ';
            }
            if (error.includes('"OSDS"')) {
                res += sep + "Can't find outputs with ScriptDatums";
                sep = ', ';
            }

            if (error.includes('"PD"')) {
                res += sep + 'Wrong PoolDatum';
                sep = ', ';
            }
            if (error.includes('"FD"')) {
                res += sep + 'Wrong FundDatum';
                sep = ', ';
            }
            if (error.includes('"UD"')) {
                res += sep + 'Wrong UserDatum';
                sep = ', ';
            }

            if (error.includes('"TPD"')) {
                res += sep + 'Is PoolDatum';
                sep = ', ';
            }
            if (error.includes('"TFD"')) {
                res += sep + 'Is FundDatum';
                sep = ', ';
            }
            if (error.includes('"TUD"')) {
                res += sep + 'Is UserDatum';
                sep = ', ';
            }
            if (error.includes('"TSD"')) {
                res += sep + 'Is ScriptDatum';
                sep = ', ';
            }
            if (error.includes('"TOD"')) {
                res += sep + 'Is OtherDatum';
                sep = ', ';
            }

            if (error.includes('"PDV"')) {
                res += sep + 'PoolDatum wrong Value';
                sep = ', ';
            }
            if (error.includes('"FDV"')) {
                res += sep + 'FundDatum wrong Value';
                sep = ', ';
            }
            if (error.includes('"UDV"')) {
                res += sep + 'UserDatum wrong Value';
                sep = ', ';
            }

            if (error.includes('"FDOV"')) {
                res += sep + 'Wrong FundDatum or Value';
                sep = ', ';
            }

            if (error.includes('"BEGINATREACHED"')) {
                res += sep + 'The Pool is already started';
                sep = ', ';
            }
            if (error.includes('"BEGINATNOTREACHED"')) {
                res += sep + "The Pool hasn't started yet.";
                sep = ', ';
            }

            if (error.includes('"DEADLINEREACHED"')) {
                res += sep + 'The Pool is already Closed';
                sep = ', ';
            }
            if (error.includes('"DEADLINENOTREACHED"')) {
                res += sep + 'Deadline has not arrived yet';
                sep = ', ';
            }

            if (error.includes('"TERMINATED"')) {
                res += sep + 'The Pool is already Terminated';
                sep = ', ';
            }
            if (error.includes('"NOTTERMINATED"')) {
                res += sep + 'The Pool is not Terminated yet';
                sep = ', ';
            }
            if (error.includes('"CLOSED"')) {
                res += sep + 'The Pool is already Closed';
                sep = ', ';
            }

            if (error.includes('"PPMSM"')) {
                res += sep + 'The signature of one of the Pool Masters is required';
                sep = ', ';
            }
            if (error.includes('"MSM"')) {
                res += sep + 'The signature of the Master and the Redeemer do not match';
                sep = ', ';
            }
            if (error.includes('"APPMSM"')) {
                res += sep + 'The signature of all of the Pool Masters is required';
                sep = ', ';
            }

            if (error.includes('"USM"')) {
                res += sep + 'Signature of user and Redeemer do not match';
                sep = ', ';
            }
            if (error.includes('"UR"')) {
                res += sep + 'User signature and Datum do not match';
                sep = ', ';
            }

            if (error.includes('"RANGE"')) {
                res += sep + 'The Transaction validation time is incorrect';
                sep = ', ';
            }

            if (error.includes('"MAMT"')) {
                res += sep + 'Wrong Mint amount';
                sep = ', ';
            }
            if (error.includes('"BNFTAMT"')) {
                res += sep + 'Wrong NFT Burn amount';
                sep = ', ';
            }
            if (error.includes('"BTAMT"')) {
                res += sep + 'Wrong Token Burn amount';
                sep = ', ';
            }

            if (error.includes('"UTXO"')) {
                res += sep + 'NFT mining UTxO missing';
                sep = ', ';
            }

            if (error.includes('"WIO"')) {
                res += sep + 'Wrong Input Output set';
                sep = ', ';
            }
            if (error.includes('"ADD"')) {
                res += sep + "Can't find any Address";
                sep = ', ';
            }
            if (error.includes('"INVIO"')) {
                res += sep + 'Invalid Inputs and Outputs';
                sep = ', ';
            }
            if (error.includes('"INVR"')) {
                res += sep + 'Invalid Redeemers';
                sep = ', ';
            }

            if (error.includes('"DATE"')) {
                res += sep + 'Invalid Datum Date';
                sep = ', ';
            }
            if (error.includes('"CLAIM"')) {
                res += sep + 'Invalid Rewards amount';
                sep = ', ';
            }
            if (error.includes('"INVEST"')) {
                res += sep + 'Invalid Deposit amount';
                sep = ', ';
            }

            if (error.includes('"FundID"')) {
                res += sep + 'Missing Minted FundID NFT';
                sep = ', ';
            }
            if (error.includes('"UserID"')) {
                res += sep + 'Missing Minted UserID NFT';
                sep = ', ';
            }
            if (error.includes('"ScriptID"')) {
                res += sep + 'Missing Minted ScriptID NFT';
                sep = ', ';
            }
            if (error.includes('"ScriptID2"')) {
                res += sep + 'Missing Minted ScriptID Type NFT';
                sep = ', ';
            }
            if (error.includes('"TxID"')) {
                res += sep + 'Missing Minted TxID NFT';
                sep = ', ';
            }

            if (error.includes('"BFID"')) {
                res += sep + 'Not Burning FundID';
                sep = ', ';
            }
            if (error.includes('"BUID"')) {
                res += sep + 'Not Burning UserID';
                sep = ', ';
            }
            if (error.includes('"BUD"')) {
                res += sep + 'Not Burning User Deposit Tokens';
                sep = ', ';
            }
            if (error.includes('"BSID"')) {
                res += sep + 'Not Burning ScriptID';
                sep = ', ';
            }

            if (error.includes('"MFAM"')) {
                res += sep + 'Missing Minted TxID Master Fund And Merge NFT';
                sep = ', ';
            }
            if (error.includes('"MM"')) {
                res += sep + 'Missing Minted TxID Master Merge Fund NFT';
                sep = ', ';
            }
            if (error.includes('"MS"')) {
                res += sep + 'Missing Minted TxID Master Split Fund NFT';
                sep = ', ';
            }
            if (error.includes('"MCP"')) {
                res += sep + 'Missing Minted TxID Master Close Pool NFT';
                sep = ', ';
            }
            if (error.includes('"MTP"')) {
                res += sep + 'Missing Minted TxID Master Terminate Pool NFT';
                sep = ', ';
            }
            if (error.includes('"MCE"')) {
                res += sep + 'Missing Minted TxID Master Emergency NFT';
                sep = ', ';
            }
            if (error.includes('"MD"')) {
                res += sep + 'Missing Minted TxID Master Delete Fund NFT';
                sep = ', ';
            }
            if (error.includes('"MSBF"')) {
                res += sep + 'Missing Minted TxID Master Send Back Fund NFT';
                sep = ', ';
            }
            if (error.includes('"MSBI"')) {
                res += sep + 'Missing Minted TxID Master Send Back Deposit NFT';
                sep = ', ';
            }
            if (error.includes('"MAS"')) {
                res += sep + 'Missing Minted TxID Master Add Scripts NFT';
                sep = ', ';
            }
            if (error.includes('"MDS"')) {
                res += sep + 'Missing Minted TxID Master Delete Scripts NFT';
                sep = ', ';
            }

            if (error.includes('"UI "')) {
                res += sep + 'Missing Minted TxID User Deposit NFT';
                sep = ', ';
            }
            if (error.includes('"UGR"')) {
                res += sep + 'Missing Minted TxID User Harvest NFT';
                sep = ', ';
            }
            if (error.includes('"UGI"')) {
                res += sep + 'Missing Minted TxID User Withdraw NFT';
                sep = ', ';
            }

            if (error.includes('"SA"')) {
                res += sep + 'Wrong Split Amount';
                sep = ', ';
            }
            if (error.includes('"CA"')) {
                res += sep + 'Invalid Close Date';
                sep = ', ';
            }
            if (error.includes('"CLA"')) {
                res += sep + 'Invalid Claim Date';
                sep = ', ';
            }

            if (error.includes('"MSBFV"')) {
                res += sep + 'Wrong Value paid to Master ';
                sep = ', ';
            }
            if (error.includes('"MSBIV"')) {
                res += sep + 'Wrong Value paid to User ';
                sep = ', ';
            }
            if (error.includes('"UIGB"')) {
                res += sep + 'You must return UI Tokens';
                sep = ', ';
            }
            if (error.includes('"FCNZ"')) {
                res += sep + 'Fund Count is not Zero';
                sep = ', ';
            }

            if (error.includes('"FUNDAMT0"')) {
                res += sep + 'Fund Amount should be Zero';
                sep = ', ';
            }

            if (error.includes('"IFDQTY"')) {
                res += sep + 'You must use the minimum amount possible of FundDatums to cover the claim Amount';
                sep = ', ';
            }

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
