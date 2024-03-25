import { Address, Assets, Blockfrost, Data, Lucid, Script, SpendingValidator, generatePrivateKey } from 'lucid-cardano';
import styles from './Home.module.scss';
import { useState, useEffect } from 'react';
import {
    ADA_UI,
    BaseSmartDBFrontEndApiCalls,
    LucidToolsFrontEnd,
    Maybe,
    SmartUTxOFrontEndApiCalls,
    addAssetsList,
    addressToPubKeyHash,
    calculateMinAdaOfUTxO,
    formatAmountWithUnit,
    formatHash,
    formatTokenAmount,
    getTotalOfUnitInUTxOList,
    showData,
    strToHex,
} from '@/src/lib/SmartDB';
import { GetServerSideProps } from 'next';
import { MongoClient } from 'mongodb';
import React from 'react';
import { Program } from '@hyperionbt/helios';
import LoaderButton from '../../Commons/LoaderButton/LoaderButton';
import { DummyEntity } from '@/src/lib/Example-AlwaysSucess/Entities/Dummy.Entity';
import { th } from 'date-fns/locale';
import { DummyApi } from '@/src/lib/Example-AlwaysSucess/FrontEnd/Dummy.FrontEnd.Api.Calls';

export default function Home() {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //--------------------------------------
    const [isLoading, setIsLoading] = useState(false);
    const [lucid, setLucid] = useState<Lucid>();
    const [privateKey, setPrivateKey] = useState<string>();
    const [address, setAddress] = useState<string>();
    const [balance, setBalance] = useState<bigint>();
    const [datumID_CS, setDatumID_CS] = useState<string>();
    const [datumID_TN, setDatumID_TN] = useState<string>();
    const [mintingIdScript, setMintingIdScript] = useState<Script>();
    const [validatorScript, setValidatorScript] = useState<Script>();
    const [validatorAddress, setValidatorAddress] = useState<string>();
    const [txHash, setTxHash] = useState<string>();
    const [txConfirmed, setTxConfirmed] = useState(false);
    const [list, setList] = useState<DummyEntity[]>();
    //--------------------------------------
    async function generateScripts(lucid: Lucid) {
        if (lucid === undefined) return;
        //----------------------------
        const simplify = true;
        //----------------------------
        const tokenName = 'DummyID';
        //----------------------------
        const srcMintingID = `
    minting utxo_nft

    func main(_,_) -> Bool {
        true
    }`;
        //----------------------------
        const programMintingID = Program.new(srcMintingID);
        const myUplcProgramMintingID = programMintingID.compile(simplify);
        // console.log(myUplcProgram.serialize())
        const jSonUPLCMintingID = JSON.parse(myUplcProgramMintingID.serialize());
        const policyId = myUplcProgramMintingID.mintingPolicyHash.hex;
        const cborHexMintingID = jSonUPLCMintingID.cborHex;
        //----------------------------
        const srcValidator = `
    // all Helios scripts begin with a script purpose
    spending always_true 
    
    struct Datum {
        ddPaymentPKH: PubKeyHash
        ddStakePKH: Option[PubKeyHash
    ]
    }

    // the spending entrypoint function accepts three arguments and 
    //  contains the core validator logic
    // 'main' returns true if a given UTxO is allowed to be spent
    func main(datum: Datum, _, ctx: ScriptContext) -> Bool {
        // the Helios DSL is expression based
        ctx.tx.is_signed_by( datum.ddPaymentPKH )
    }
        `;

        // now: Time = tx.time_range.start;
        // tx.is_signed_by(datum.owner) || (
        //     tx.is_signed_by(datum.beneficiary) &&
        //     now > datum.lockUntil
        // )
        //----------------------------
        const programValidator = Program.new(srcValidator);
        const myUplcProgramValidator = programValidator.compile(simplify);
        // console.log(myUplcProgram.serialize())
        const jSonUPLCValidator = JSON.parse(myUplcProgramValidator.serialize());
        const scriptHash = myUplcProgramValidator.validatorHash.hex;
        const cborHexValidator = jSonUPLCValidator.cborHex;
        //----------------------------
        const mintingIdScript: SpendingValidator = {
            type: 'PlutusV2',
            script: cborHexMintingID,
        };
        const validatorScript: SpendingValidator = {
            type: 'PlutusV2',
            script: cborHexValidator,
        };
        //----------------------------
        const alwaysSucceedAddress: Address = lucid.utils.validatorToAddress(validatorScript);
        console.log(`alwaysSucceedAddress: ${alwaysSucceedAddress}`);
        //----------------------------
        setValidatorAddress(alwaysSucceedAddress);
        setMintingIdScript(mintingIdScript);
        setValidatorScript(validatorScript);
        setDatumID_CS(policyId);
        setDatumID_TN(tokenName);
        //----------------------------
        await BaseSmartDBFrontEndApiCalls.createHookApi(DummyEntity, alwaysSucceedAddress, policyId);
    }
    //--------------------------------------
    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            try {
                const lucid = await LucidToolsFrontEnd.initializeLucidWithBlockfrost();
                const privateKey = lucid.utils.generatePrivateKey(); // Bech32 encoded private key
                setLucid(lucid);
                setPrivateKey(privateKey);
                console.log(`privateKey: ${privateKey}`);
                await generateScripts(lucid);
                const list: DummyEntity[] = await DummyApi.getAllApi_();
                setList(list);
            } catch (e) {
                console.error(e);
            }
            setIsLoading(false);
        };
        fetch();
    }, []);

    //--------------------------------------
    useEffect(() => {
        const fetch = async () => {
            if (lucid === undefined) return;
            if (privateKey === undefined) return;
            setIsLoading(true);
            try {
                lucid.selectWalletFromPrivateKey(privateKey);
                const address = await lucid.wallet.address();
                console.log(`wallet address: ${address}`);
                setAddress(address);
            } catch (e) {
                console.error(e);
                setAddress('');
            }
            setIsLoading(false);
            getBalance();
        };
        if (lucid !== undefined && privateKey !== undefined) {
            fetch();
        }
    }, [lucid, privateKey]);
    //--------------------------------------
    const getBalance = async () => {
        if (lucid === undefined) return;
        if (privateKey === undefined) return;
        //----------------------------
        setIsLoading(true);
        //----------------------------
        try {
            //----------------------------
            const utxos = await lucid.wallet.getUtxos();
            //----------------------------
            const balance = getTotalOfUnitInUTxOList('lovelace', utxos);
            setBalance(balance);
            //----------------------------
            console.log(`balance: ${balance.toString()}`);
            //----------------------------
        } catch (e) {
            console.error(e);
            setBalance(0n);
        }
        //----------------------------
        setIsLoading(false);
    };
    //--------------------------------------
    const handleBtnFaucet = async () => {
        if (lucid === undefined) return;
        if (privateKey === undefined) return;
        //----------------------------
        //open link https://docs.cardano.org/cardano-testnet/tools/faucet/
        //----------------------------
        window.open('https://docs.cardano.org/cardano-testnet/tools/faucet/');
    };
    const handleBtnBalance = async () => {
        getBalance();
    };
    const handleBtnCreateTx = async () => {
        if (lucid === undefined) return;
        if (privateKey === undefined) return;
        if (address === undefined) return;
        if (datumID_CS === undefined) return;
        if (datumID_TN === undefined) return;
        if (validatorAddress === undefined) return;
        if (mintingIdScript === undefined) return;
        //----------------------------
        setIsLoading(true);
        setTxConfirmed(false);
        try {
            setTxHash(undefined);
            //----------------------------
            const lucidAC_MintID = datumID_CS + strToHex(datumID_TN);
            const valueFor_Mint_ID: Assets = { [lucidAC_MintID]: 1n };
            console.log(`valueFor_Mint_ID: ${showData(valueFor_Mint_ID)}`);
            //----------------------------
            let valueFor_DummyDatum_Out: Assets = valueFor_Mint_ID;
            const minADA_For_DummyDatum = calculateMinAdaOfUTxO({ assets: valueFor_DummyDatum_Out });
            const value_MinAda_For_DummyDatum: Assets = { lovelace: minADA_For_DummyDatum };
            valueFor_DummyDatum_Out = addAssetsList([value_MinAda_For_DummyDatum, valueFor_DummyDatum_Out]);
            console.log(`valueFor_FundDatum_Out: ${showData(valueFor_DummyDatum_Out, false)}`);
            //--------------------------------------
            const paymentPKH = addressToPubKeyHash(address);
            const datumPlainObject = {
                ddPaymentPKH: paymentPKH,
                ddStakePKH: new Maybe(),
            };
            let dummyDatum_Out = DummyEntity.mkDatumFromPlainObject(datumPlainObject);
            console.log(`dummyDatum_Out: ${showData(dummyDatum_Out, false)}`);
            const dummyDatum_Out_Hex = DummyEntity.datumToCborHex(dummyDatum_Out);
            console.log(`dummyDatum_Out_Hex: ${showData(dummyDatum_Out_Hex, false)}`);
            //--------------------------------------
            // const Datum = () => Data.void();
            const redeemerMintID_Hex = () => Data.void();
            //--------------------------------------
            const tx = await lucid
                .newTx()
                .mintAssets(valueFor_Mint_ID, redeemerMintID_Hex())
                .payToContract(validatorAddress, { inline: dummyDatum_Out_Hex }, valueFor_DummyDatum_Out)
                .attachMintingPolicy(mintingIdScript)
                // .attachSpendingValidator(validatorScript)
                .complete();
            //----------------------------
            const signedTx = await tx.sign().complete();
            const txHash = await signedTx.submit();
            //----------------------------
            setTxHash(txHash);
            console.log(`txHash: ${txHash}`);
            //----------------------------
            if (await lucid.awaitTx(txHash)) {
                console.log('Tx confirmed');
                setTxConfirmed(true);
            } else {
                console.log('Tx not confirmed');
                throw new Error('Tx not confirmed');
            }
        } catch (e) {
            console.error(e);
            setTxHash(undefined);
        }
        setIsLoading(false);
    };
    const handleBtnSync = async () => {
        //----------------------------
        if (lucid === undefined) return;
        if (privateKey === undefined) return;
        if (validatorAddress === undefined) return;
        //----------------------------
        setIsLoading(true);
        //----------------------------
        try {
            //----------------------------
            await DummyApi.syncWithAddressApi(DummyEntity, validatorAddress, true);
            const list: DummyEntity[] = await DummyApi.getAllApi_();
            setList(list);
            //----------------------------
        } catch (e) {
            console.error(e);
        }
        //----------------------------
        setIsLoading(false);
    };
    //--
    //-------------------------------------
    return (
        <div className={styles.content}>
            <div>
                <div className={styles.title}>
                    Smart DB - Dummy test case example{' '}
                    {isLoading && (
                        <>
                            <LoaderButton></LoaderButton>
                        </>
                    )}
                </div>
            </div>
            <div>
                <div className={styles.subTitle}>Wallet Private Key:</div>
                <div>
                    <input name="privateKey" value={privateKey ?? ''} onChange={(e) => setPrivateKey(e.target.value)} />
                </div>
            </div>
            <div>
                <div className={styles.subTitle}>Address:</div>
                <div>{address}</div>
            </div>
            <div>
                <div className={styles.subTitle}>1: Faucet to get ADA</div>
                <button onClick={handleBtnFaucet}>Faucet</button>
            </div>
            <div>
                <div className={styles.subTitle}>2: Check Balance</div>
                <button onClick={handleBtnBalance}>Refresh Balance</button>
            </div>
            <div>
                <div className={styles.subTitle}>3: Make sure you have ADA Balance:</div>
                <div>{formatTokenAmount(balance, ADA_UI)}</div>
            </div>
            <div>
                <div className={styles.subTitle}>4: Create Dummy Datum Transaction</div>
                <button onClick={handleBtnCreateTx}>Create</button>
            </div>
            {txHash !== undefined && (
                <>
                    <div>
                        <div className={styles.subTitle}>Tx Hash:</div>
                        <div>{txHash}</div>
                    </div>
                    <div>
                        <div className={styles.subTitle}>Tx Status:</div>
                        <div>{txConfirmed ? 'Confirmed' : 'Waiting...'}</div>
                    </div>
                </>
            )}
            <div>
                <div className={styles.subTitle}>5: Sycn Database</div>
                <button onClick={handleBtnSync}>Sync</button>
            </div>
            <div>
                <div className={styles.subTitle}>List</div>
                <div className={styles.listContainer}>
                    <div className={styles.item}>
                        <div className={styles.itemID}>DB Id</div>
                        <div>Datum PaymentPKH</div>
                    </div>
                    {list?.length === 0 && <div>No data</div>}
                    {list?.map((item, index) => (
                        <div key={index} className={styles.item}>
                            <div className={styles.itemID}>{item._DB_id}</div>
                            <div>{item.ddPaymentPKH}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div></div>
        </div>
    );
}
