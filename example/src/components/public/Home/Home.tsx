import { DummyEntity } from '@example/src/lib/DummyExample/Entities/Dummy.Entity';
import {
    DummyPolicyRedeemerBurnID,
    DummyPolicyRedeemerMintID,
    DummyValidatorRedeemerClaim,
    DummyValidatorRedeemerDatumUpdate,
} from '@example/src/lib/DummyExample/Entities/Redeemers/Dummy.Redeemer';
import { DummyApi } from '@example/src/lib/DummyExample/FrontEnd/Dummy.FrontEnd.Api.Calls';
import {
    ADA_UI,
    BaseSmartDBFrontEndApiCalls,
    CS,
    LucidToolsFrontEnd,
    Maybe,
    addAssetsList,
    addressToPubKeyHash,
    calculateMinAdaOfUTxO,
    formatHash,
    formatTokenAmount,
    formatUTxO,
    getTotalOfUnitInUTxOList,
    objToCborHex,
    showData,
    strToHex,
} from 'smart-db/index'
import { Address, Assets, Data, Lucid, Script, SpendingValidator } from 'lucid-cardano';
import { useEffect, useState } from 'react';
import LoaderButton from '../../Commons/LoaderButton/LoaderButton';
import styles from './Home.module.scss';
import Modal from 'react-modal';

export default function Home() {
    //--------------------------------------
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        setIsRefreshing(false);
    }, []);
    //--------------------------------------
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSync, setIsLoadingSync] = useState(false);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [isLoadingTxCreate, setIsLoadingTxCreate] = useState(false);
    const [isLoadingTxUpdate, setIsLoadingTxUpdate] = useState(false);
    const [isLoadingTxClaim, setIsLoadingTxClaim] = useState(false);
    //--------------------------------------
    const [lucid, setLucid] = useState<Lucid>();
    const [privateKey, setPrivateKey] = useState<string>();
    const [address, setAddress] = useState<string>();
    const [balance, setBalance] = useState<bigint>();
    //--------------------------------------
    const [datumID_CS, setDatumID_CS] = useState<string>();
    const [datumID_TN, setDatumID_TN] = useState<string>();
    const [mintingIdDummy, setMintingIdDummy] = useState<Script>();
    const [validatorDummy, setValidatorDummy] = useState<Script>();
    const [validatorAddress, setValidatorAddress] = useState<string>();
    //--------------------------------------
    const [list, setList] = useState<DummyEntity[]>();
    const [selectedItem, setSelectedItem] = useState<DummyEntity>();
    //--------------------------------------
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [txHash, setTxHash] = useState<string>();
    const [isTxError, setIsTxError] = useState(false);
    const [txMessage, setTxMessage] = useState('');
    const [txConfirmed, setTxConfirmed] = useState(false);
    //--------------------------------------
    const [isWalletConnectorModalOpen, setIsWalletConnectorModalOpen] = useState(false);
    //--------------------------------------
    const [inputValue, setInputValue] = useState('');
    const [isEditingValue, setIsEditingValue] = useState(false);
    const [editValue, setEditValue] = useState('');
    //--------------------------------------
    async function generateScripts(lucid: Lucid) {
        if (lucid === undefined) return;
        //----------------------------
        const cborHexMintingID =
            '590b64590b610100003232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232223232323253353355333573460720022642446004006a666ae68c0dcd55ce9baa357426aae780080440d454ccd5cd181c0008990911800801a999ab9a303735573a6ea8d5d09aab9e0020110350352325335533500102c2213335530260383303022333013037002001301102f23500122333573466e20005200003701500302b1335738921236e6f742069734275726e696e67416c6c546f6b656e4f776e4353416e79416d6f756e7400010350042235002222222222222323304b2253350011302102022135002225333573466e3c00801c4c094c0d80044c01800c024c07c04894cd4cc094d401088d4008888888888888c8c8cc130894cd40044c00c084884d4008894ccd5cd19b8f0020081300730370011300600300a233335530330453303d22333501f0440010023501d03c223355303404723500122330420023355303704a2350012233045002333500137009000380233700002900000099aa981a02391a8009119821001199a800919aa981c02591a800911982300118120008009119981000f801000919aa981c02591a8009119823001181280080099980d80d00080119aa981902291a80091198231982000299823198200010008220221810000998219981ea4500330433303d48810048000104104c07c048cc0cccc0b4c044010cc0cccc0b52210744756d6d79494400480080c40c40a84cd5ce24811d6e6f74206973436f72726563744d696e745f416e645f4f7574707574730000f0111635573a0026ea80114ccd5cd181a1aab9d0011323232321233001003002301a357426ae8800d4ccd5cd181b1aab9d00113232323232323232323232323232323232323232323232321233333333333300101801601401201000e00c0090070050030023035357426ae88008ccc0b5d710009aba10013574400466605605a40026ae84004d5d1001198153ae357420026ae8800d4ccd5cd18231aab9d0011323232323212330010040025333573460946aae740044c8c8c848cc00400c008c09cd5d09aba20023302775a6ae84004d55cf0008241baa357426ae8800d4ccd5cd18241aab9d001132323212330010030023025357426ae88008cc095d69aba100135573c00208c6ea8d5d08009aab9e00104437546ae84004d5d10011998120143ad357420026ae88008cc08c094d5d08009aba200233302075c03e6ae84004d5d100119980f3ae01d357420026ae88008cc074064d5d08009aba20023301b016357420026ae88008cc064050d5d08009aab9e00103437546ae84004d55cf0008191baa00122333573466e3c0080040ac024888ccd54c0b80bc0b4cd54c0700bc8d400488cc0a8008c020004ccd54c0b80bc88d4008894cd4ccd54c0840cccc0ac88ccc0280c8008004c0200a88d400488cc028008014018400c4cc0c401000c0ac004cd54c0700bc8d400488cc0a8008cc0e4894cd40044c02c00c884d4008894cd4cc03000802044888cc0080280104c01800c0100088cc004894cd400808c400401884888c00c01084888c004010cc080888c00cc00800480048cc004894cd40084004080090407494cd40048400454cd5ce24810866726f6d4a75737400162350012233335001029200102902910232325333573460500020322a666ae68c09c004068094d55ce9baa001223232533357346054002224440022a666ae68c0a40044c84888c00c010c010d5d09aab9e00215333573460500022244400404c6aae74004dd50009192999ab9a302535573a00226464642466002006004600a6ae84d5d100118069aba100135573c0020466ea80048c94ccd5cd18121aab9d0011323232323232323232321233330010090070030023300c75c6ae84d5d10022999ab9a302e00113212223002004357426aae7800854ccd5cd1816800899091118008021bae357426aae7800854ccd5cd1816000889110018151aab9d00137546ae84004d5d1001199804bae008357420026ae8800d4ccd5cd18131aab9d001132323212330010030023300700d357426ae88008c034d5d08009aab9e00102437546ae84004d55cf0008111baa00122323253335734604a0022601c60086ae84d55cf0010a999ab9a302600101802335573a0026ea8004cc005d73ad222330262233335573e002403c4646604266036600e6aae74004c018d55cf00098021aba2003357420040426eac00488cc09088cccd55cf800900e11980f18029aba100230033574400403e6eb00048c8c94ccd5cd181180089909111180200298021aba135573c0042a666ae68c0880044c848888c008014c014d5d09aab9e002153335734604200226424444600200a600e6ae84d55cf0010a999ab9a3020001132122223003005375c6ae84d55cf00100f1aab9d00137540024646464a666ae68cdc3a40180042244444440062a666ae68cdc3a40140042244444440082a666ae68cdc3a40100042646424444444660020120106eb4d5d09aba25002375c6ae85400454ccd5cd18118010991909111111198010048041bae357426ae894008dd71aba15001153335734604400426464244444446600c0120106eb8d5d09aba25002300535742a0022a666ae68c0840084c848888888c01c020c014d5d09aab9e003153335734604000426424444444600a010600a6ae84d55cf00180f09aab9e00235573a0026ea80048c8c94ccd5cd180f800899191919190911998008030020019bad357426ae88008dd69aba1001357440046eb4d5d08009aab9e002153335734603c002264244600400660086ae84d55cf00100e1aab9d001375400246464a666ae68c0780044c8488c00400cdd71aba135573c0042a666ae68c0740044c8488c00800cdd71aba135573c0040366aae74004dd50009192999ab9a301b35573a002264646424660020060046eb4d5d09aba20023004357420026aae78004064dd50009192999ab9a301a35573a00226eb8d5d09aab9e0010183754002424460040066034442244a66a0020184426602e600800466aa600c03200800260324422444a66a00226a00601c442666a00a02c6008004666aa600e03200a0080026a0040106a00201a601024446600644a66a0042a66a0020124426a00444a66a6601602800226601002800601c4426a00444a66a00a2a66a6601600202826601000602801c4426a00444a666ae68cdc78030010a99a99807802800899806003801809099998059980a003002803980b891198011980b00200180080191111a80211299a8018a99a9980580080a0998040028020071109a801112999ab9a3371e00c0042a66a6601e00a002266018012666aa6036038034006010024266660166602800c00a01266034660280040020100066a00400a6a002014600a24446600644a66a0042a66a00200c4426a00444a666ae68c0600044cc02004400c02c884d4008894cd401454ccd5cd180c0008998040018088059109a80111192999ab9a301d00613300d0083301833012003002004153335734603a00426601a660306602400e00c0100082a666ae68cdc78038018a999ab9a3370e00c00426601a010008002002266660166602200c00a00e6028244660046602600800600200644446a00844a66a0060164426a00444a666ae68c0700044cccc02ccc04401801402402000c54ccd5cd19b8f00600215333573466e1c0140044cc030024ccd54c06006405c00c0204cccc02ccc044018014024cc05ccc04400800402000c4cccc02ccc044018014024cc05ccc04400800402000c401c44004880048848cc00400c0088cc00800800488c8c848cc0048c00c88c00800c8c00c88c00400c8d4c00800cd400c004c0080088cd400401000840048800888488cc00401000cc02088448894cd40044008884cc014008ccd54c01c0200140100044800454cd5ce2481035054310016253357389201024c680016370e90001b8748008dc3a40086e1d200623230010012233003300200200101';
        //----------------------------
        const cborHexValidator =
            '5906cb5906c80100003232323232323232323232323232323232323232323232323232323232222323232325335533553355333573466e3d22011cfa94d44de3b28e5d9fb37254b9134373c5771ac89848e94b887ce2550048810001c018018133573892010001d132533535004222222222222533533355330312211222533500113500322001221333500502d300400233355300702b005004001024123300122533500221003100102b25333573466e3c0380044c0b00040a801080980a40644cd5ce2481136e6f742069735369676e6564427941646d696e0001e3500101a01c1120011653335734603e6aae740044c94ccd5cd18101aab9d0011323232323212333001005003002375a6ae84d5d10011980f3ae357420026ae88008dd71aba100135573c00203e6ea8d5d09aab9e00101e375400a6aa666ae68c074d55ce800899191919091980080180118089aba135744006a666ae68c07cd55ce80089919191919191919191919191919191919191919191919190919999999999980080c00b00a00900800700600480380280180118161aba135744004666044eb88004d5d08009aba20023330200242001357420026ae88008cc07dd71aba100135744006a666ae68c0bcd55ce8008991919191909198008020012999ab9a303335573a00226464642466002006004603a6ae84d5d10011980ebad357420026aae780040c8dd51aba135744006a666ae68c0c4d55ce80089919190919800801801180d9aba13574400466036eb4d5d08009aab9e00103037546ae84004d55cf0008171baa357420026ae88008ccc06407dd69aba100135744004660300386ae84004d5d100119980abae014357420026ae88008ccc04dd70091aba1001357440046602401e6ae84004d5d1001198080061aba1001357440046601c0146ae84004d55cf00080f1baa357420026aae78004070058dd50009192999ab9a301b001012153335734603400202c0326aae74dd50009119192999ab9a301d0011122200115333573460380022642444600600860086ae84d55cf0010a999ab9a301b0011122200201a35573a0026ea80048c94ccd5cd180c1aab9d001132323212330010030023005357426ae88008c038d5d08009aab9e0010173754002464a666ae68c05cd55ce8008991919191919191919190919998008048038018011980dbae357426ae880114ccd5cd1810800899091118010021aba135573c0042a666ae68c0800044c84888c004010dd71aba135573c0042a666ae68c07c0044488800c078d55ce8009baa357420026ae88008ccc021d70039aba100135744006a666ae68c064d55ce800899191909198008018011980b0071aba135744004601c6ae84004d55cf00080c1baa357420026aae78004058dd500099800bae75a44466034446666aae7c00480208c8c8c8cc03048cc00400c008c018d5d100298039aab9e002300735573a0026ae8400803cdd5800911980c111999aab9f001200623300730053574200460066ae88008034dd600088051109119800802001919192999ab9a30150011321222230040053004357426aae7800854ccd5cd180a00089909111180100298029aba135573c0042a666ae68c04c0044c848888c004014c01cd5d09aab9e002153335734602400226424444600600a6eb8d5d09aab9e00201135573a0026ea80048c8c8c94ccd5cd19b874803000844888804054ccd5cd19b874802800844888888801054ccd5cd19b87480200084c8c848888888cc004024020dd69aba135744a0046eb8d5d0a8008a999ab9a3015002132321222222233002009008375c6ae84d5d128011bae35742a0022a666ae68c0500084c8c848888888cc018024020dd71aba135744a004600a6ae85400454ccd5cd180980109909111111180380418029aba135573c0062a666ae68c0480084c848888888c014020c014d5d09aab9e003011135573c0046aae74004dd5000919192999ab9a301100113232323232122333001006004003375a6ae84d5d10011bad357420026ae88008dd69aba100135573c0042a666ae68c0400044c8488c00800cc010d5d09aab9e00200f35573a0026ea80048c8c94ccd5cd180800089909118008019bae357426aae7800854ccd5cd180780089909118010019bae357426aae78008038d55ce8009baa00123253335734601a6aae740044c8c8c848cc00400c008dd69aba13574400460086ae84004d55cf0008061baa0012325333573460186aae740044dd71aba135573c0020166ea800448004440048800888800c88c8c94ccd5cd18048008980398021aba135573c0042a666ae68c028004014020d55ce8009baa001100112200121223002003153357389201035054310016370e90001b8748008dc3a40086e1d200623230010012233003300200200101';
        //----------------------------
        const mintingIdDummy: SpendingValidator = {
            type: 'PlutusV2',
            script: cborHexMintingID,
        };
        const validatorDummy: SpendingValidator = {
            type: 'PlutusV2',
            script: cborHexValidator,
        };
        //----------------------------
        const policyID_CS: CS = lucid.utils.mintingPolicyToId(mintingIdDummy);
        const tokenName = 'DummyID';
        console.log(`policyID_CS: ${policyID_CS}`);
        //----------------------------
        const validatorAddress: Address = lucid.utils.validatorToAddress(validatorDummy);
        console.log(`validatorAddress: ${validatorAddress}`);
        //----------------------------
        setValidatorAddress(validatorAddress);
        setMintingIdDummy(mintingIdDummy);
        setValidatorDummy(validatorDummy);
        setDatumID_CS(policyID_CS);
        setDatumID_TN(tokenName);
        //----------------------------
        await BaseSmartDBFrontEndApiCalls.createHookApi(DummyEntity, validatorAddress, policyID_CS);
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
                const list: DummyEntity[] = await DummyApi.getAllApi_({ fieldsForSelect: {}, loadRelations: { smartUTxO_id: true } });
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
        setIsLoadingBalance(true);
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
        setIsLoadingBalance(false);
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
        //----------------------------
        if (lucid === undefined) return;
        if (privateKey === undefined) return;
        if (address === undefined) return;
        if (datumID_CS === undefined) return;
        if (datumID_TN === undefined) return;
        if (validatorAddress === undefined) return;
        if (mintingIdDummy === undefined) return;
        //----------------------------
        setIsTxModalOpen(true);
        //----------------------------
        if (isLoadingTxCreate) {
            return;
        }
        //----------------------------
        setIsLoadingTxCreate(true);
        setTxConfirmed(false);
        try {
            setTxHash(undefined);
            setIsTxError(false);
            setTxMessage('Creating Transaction...');
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
                ddValue: BigInt(inputValue),
            };
            let dummyDatum_Out = DummyEntity.mkDatumFromPlainObject(datumPlainObject);
            console.log(`dummyDatum_Out: ${showData(dummyDatum_Out, false)}`);
            const dummyDatum_Out_Hex = DummyEntity.datumToCborHex(dummyDatum_Out);
            console.log(`dummyDatum_Out_Hex: ${showData(dummyDatum_Out_Hex, false)}`);
            //--------------------------------------
            const dummyPolicyRedeemerMintID = new DummyPolicyRedeemerMintID();
            console.log(`dummyPolicyRedeemerMintID: ${showData(dummyPolicyRedeemerMintID, false)}`);
            const dummyPolicyRedeemerMintID_Hex = objToCborHex(dummyPolicyRedeemerMintID);
            console.log(`dummyPolicyRedeemerMintID_Hex: ${showData(dummyPolicyRedeemerMintID_Hex, false)}`);
            //--------------------------------------
            const tx = await lucid
                .newTx()
                .mintAssets(valueFor_Mint_ID, dummyPolicyRedeemerMintID_Hex)
                .payToContract(validatorAddress, { inline: dummyDatum_Out_Hex }, valueFor_DummyDatum_Out)
                .attachMintingPolicy(mintingIdDummy)
                .complete();
            //----------------------------
            const signedTx = await tx.sign().complete();
            const txHash = await signedTx.submit();
            //----------------------------
            setTxMessage('Transaction has been submited and now waiting for confirmation...');
            //----------------------------
            setTxHash(txHash);
            console.log(`txHash: ${txHash}`);
            //----------------------------
            if (await lucid.awaitTx(txHash)) {
                console.log('Tx confirmed');
                setTxConfirmed(true);
                setTxMessage('Transaction has been confirmed!');
            } else {
                console.log('Tx not confirmed');
                throw new Error('Tx not confirmed');
            }
        } catch (e) {
            console.error(e);
            setTxHash(undefined);
            setIsTxError(true);
            setTxMessage(`Error: ${e}`);
        }
        setIsLoadingTxCreate(false);
    };
    const handleBtnClaimTx = async (item: DummyEntity) => {
        //----------------------------
        if (lucid === undefined) return;
        if (privateKey === undefined) return;
        if (address === undefined) return;
        if (datumID_CS === undefined) return;
        if (datumID_TN === undefined) return;
        if (validatorDummy === undefined) return;
        if (validatorAddress === undefined) return;
        if (mintingIdDummy === undefined) return;
        //----------------------------
        setIsTxModalOpen(true);
        //----------------------------
        if (isLoadingTxClaim) {
            return;
        }
        //----------------------------
        setSelectedItem(item);
        setIsLoadingTxClaim(true);
        setTxConfirmed(false);
        try {
            setTxHash(undefined);
            setIsTxError(false);
            setTxMessage('Creating Transaction...');
            //----------------------------
            const lucidAC_BurnID = datumID_CS + strToHex(datumID_TN);
            const valueFor_Burn_ID: Assets = { [lucidAC_BurnID]: -1n };
            console.log(`valueFor_Burn_ID: ${showData(valueFor_Burn_ID)}`);
            //----------------------------
            const dummyDatum_UTxO = item.smartUTxO?.getUTxO();
            if (dummyDatum_UTxO === undefined) return;
            //--------------------------------------
            const dummyPolicyRedeemerBurnID = new DummyPolicyRedeemerBurnID();
            console.log(`dummyPolicyRedeemerBurnID: ${showData(dummyPolicyRedeemerBurnID, false)}`);
            const dummyPolicyRedeemerBurnID_Hex = objToCborHex(dummyPolicyRedeemerBurnID);
            console.log(`dummyPolicyRedeemerBurnID_Hex: ${showData(dummyPolicyRedeemerBurnID_Hex, false)}`);
            //--------------------------------------
            const dummyValidatorRedeemerClaim = new DummyValidatorRedeemerClaim();
            console.log(`dummyValidatorRedeemerClaim: ${showData(dummyValidatorRedeemerClaim, false)}`);
            const dummyValidatorRedeemerClaim_Hex = objToCborHex(dummyValidatorRedeemerClaim);
            console.log(`dummyValidatorRedeemerClaim_Hex: ${showData(dummyValidatorRedeemerClaim_Hex, false)}`);
            //--------------------------------------
            const tx = await lucid
                .newTx()
                .mintAssets(valueFor_Burn_ID, dummyPolicyRedeemerBurnID_Hex)
                .collectFrom([dummyDatum_UTxO], dummyValidatorRedeemerClaim_Hex)
                .attachMintingPolicy(mintingIdDummy)
                .attachSpendingValidator(validatorDummy)
                .addSigner(address)
                .complete();
            //----------------------------
            const signedTx = await tx.sign().complete();
            const txHash = await signedTx.submit();
            //----------------------------
            setTxMessage('Transaction has been submited and now waiting for confirmation...');
            //----------------------------
            setTxHash(txHash);
            console.log(`txHash: ${txHash}`);
            //----------------------------
            if (await lucid.awaitTx(txHash)) {
                console.log('Tx confirmed');
                setTxConfirmed(true);
                setTxMessage('Transaction has been confirmed!');
            } else {
                console.log('Tx not confirmed');
                throw new Error('Tx not confirmed');
            }
        } catch (e) {
            console.error(e);
            setTxHash(undefined);
            setIsTxError(true);
            setTxMessage(`Error: ${e}`);
        }
        setIsLoadingTxClaim(false);
        setSelectedItem(undefined);
    };
    const handleBtnSync = async () => {
        //----------------------------
        if (lucid === undefined) return;
        if (privateKey === undefined) return;
        if (validatorAddress === undefined) return;
        //----------------------------
        setIsLoadingSync(true);
        //----------------------------
        try {
            //----------------------------
            await DummyApi.syncWithAddressApi(DummyEntity, validatorAddress, true);
            const list: DummyEntity[] = await DummyApi.getAllApi_({ fieldsForSelect: {}, loadRelations: { smartUTxO_id: true } });
            setList(list);
            //----------------------------
        } catch (e) {
            console.error(e);
        }
        //----------------------------
        setIsLoadingSync(false);
    };
    //-------------------------------------
    const startEditing = (item: DummyEntity) => {
        setSelectedItem(item);
        setIsEditingValue(true);
        setEditValue(item.ddValue.toString());
    };
    const finishEditing = () => {
        setSelectedItem(undefined);
        setIsEditingValue(false);
        setEditValue('');
    };
    const handleBtnUpdateTx = async (item: DummyEntity) => {
        //----------------------------
        if (lucid === undefined) return;
        if (privateKey === undefined) return;
        if (address === undefined) return;
        if (datumID_CS === undefined) return;
        if (datumID_TN === undefined) return;
        if (validatorDummy === undefined) return;
        if (validatorAddress === undefined) return;
        if (mintingIdDummy === undefined) return;
        //----------------------------
        setIsTxModalOpen(true);
        //----------------------------
        if (isLoadingTxUpdate) {
            return;
        }
        //----------------------------
        setSelectedItem(item);
        setIsEditingValue(false);
        setIsLoadingTxUpdate(true);
        setTxConfirmed(false);
        try {
            setTxHash(undefined);
            setIsTxError(false);
            setTxMessage('Creating Transaction...');
            //----------------------------
            const lucidAC_ID = datumID_CS + strToHex(datumID_TN);
            const valueFor_ID: Assets = { [lucidAC_ID]: 1n };
            console.log(`valueFor_ID: ${showData(valueFor_ID)}`);
            //----------------------------
            const dummyDatum_UTxO = item.smartUTxO?.getUTxO();
            if (dummyDatum_UTxO === undefined) return;
            //--------------------------------------
            const paymentPKH = addressToPubKeyHash(address);
            const datumPlainObject = {
                ddPaymentPKH: paymentPKH,
                ddStakePKH: new Maybe(),
                ddValue: BigInt(editValue),
            };
            //--------------------------------------
            let valueFor_DummyDatum_Out = dummyDatum_UTxO.assets;
            //--------------------------------------
            let dummyDatum_Out = DummyEntity.mkDatumFromPlainObject(datumPlainObject);
            console.log(`dummyDatum_Out: ${showData(dummyDatum_Out, false)}`);
            const dummyDatum_Out_Hex = DummyEntity.datumToCborHex(dummyDatum_Out);
            console.log(`dummyDatum_Out_Hex: ${showData(dummyDatum_Out_Hex, false)}`);
            //--------------------------------------
            const dummyValidatorRedeemerDatumUpdate = new DummyValidatorRedeemerDatumUpdate();
            console.log(`dummyValidatorRedeemerDatumUpdate: ${showData(dummyValidatorRedeemerDatumUpdate, false)}`);
            const dummyValidatorRedeemerDatumUpdate_Hex = objToCborHex(dummyValidatorRedeemerDatumUpdate);
            console.log(`dummyValidatorRedeemerDatumUpdate_Hex: ${showData(dummyValidatorRedeemerDatumUpdate_Hex, false)}`);
            //--------------------------------------
            const tx = await lucid
                .newTx()
                .collectFrom([dummyDatum_UTxO], dummyValidatorRedeemerDatumUpdate_Hex)
                .payToContract(validatorAddress, { inline: dummyDatum_Out_Hex }, valueFor_DummyDatum_Out)
                .attachSpendingValidator(validatorDummy)
                .addSigner(address)
                .complete();
            //----------------------------
            const signedTx = await tx.sign().complete();
            const txHash = await signedTx.submit();
            //----------------------------
            setTxMessage('Transaction has been submited and now waiting for confirmation...');
            //----------------------------
            setTxHash(txHash);
            console.log(`txHash: ${txHash}`);
            //----------------------------
            if (await lucid.awaitTx(txHash)) {
                console.log('Tx confirmed');
                setTxConfirmed(true);
                setTxMessage('Transaction has been confirmed!');
            } else {
                console.log('Tx not confirmed');
                throw new Error('Tx not confirmed');
            }
        } catch (e) {
            console.error(e);
            setTxHash(undefined);
            setIsTxError(true);
            setTxMessage(`Error: ${e}`);
        }
        setIsLoadingTxUpdate(false);
        setSelectedItem(undefined);
        setEditValue('');
    };
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
                <div className={styles.subTitle}>Validator Address:</div>
                <div>{validatorAddress}</div>
            </div>
            {/* <button onClick={handleBtnConnectWallet} className={styles.buttonNormal}>
                        Connect Wallet{' '}
                        {isConnec && (
                            <>
                                <LoaderButton></LoaderButton>
                            </>
                        )}
                    </button> */}
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
                <button onClick={handleBtnFaucet} className={styles.buttonNormal}>Faucet</button>
            </div>
            <div>
                <div className={styles.subTitle}>2: Check Balance</div>
                <button onClick={handleBtnBalance} className={styles.buttonNormal}>
                    Refresh Balance{' '}
                    {isLoadingBalance && (
                        <>
                            <LoaderButton></LoaderButton>
                        </>
                    )}
                </button>
            </div>
            <div>
                <div className={styles.subTitle}>3: Make sure you have ADA Balance:</div>
                <div>{formatTokenAmount(balance, ADA_UI)}</div>
            </div>
            <div>
                <div className={styles.subTitle}>4: Create Dummy Datum Transaction</div>
                <div className={styles.createContainer}>
                    <div>
                        <div>Dummy value:</div>
                        <div>
                            <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                        </div>
                    </div> 
                    <button onClick={handleBtnCreateTx} className={styles.buttonNormal}>
                        Create{' '}
                        {isLoadingTxCreate && (
                            <>
                                <LoaderButton></LoaderButton>
                            </>
                        )}
                    </button>
                </div>
            </div>
            <div>
                <div className={styles.subTitle}>5: Sycn Database</div>
                <button onClick={handleBtnSync} className={styles.buttonNormal}>
                    Sync{' '}
                    {isLoadingSync && (
                        <>
                            <LoaderButton></LoaderButton>
                        </>
                    )}
                </button>
            </div>
            <div>
                <div className={styles.subTitle}>List</div>
                <div className={styles.listContainer}>
                    <div className={styles.item}>
                        <div className={styles.itemID}>DB Id</div>
                        <div className={styles.txHash}>UTxO</div>
                        <div className={styles.pkh}>Datum PaymentPKH</div>
                        <div className={styles.pkh}>Datum Value</div>
                    </div>
                    {list?.length === 0 && <div>No data</div>}
                    {list?.map((item, index) => (
                        <div key={index} className={styles.item}>
                            <div className={styles.itemID}>{item._DB_id.slice(0, 5)}</div>
                            <div className={styles.txHash}>{formatUTxO(item.smartUTxO?.txHash ?? '', item.smartUTxO?.outputIndex ?? 0)}</div>
                            <div className={styles.pkh}>{formatHash(item.ddPaymentPKH)}</div>
                            <div className={styles.value}>
                                {isEditingValue && selectedItem === item ? (
                                    <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                                ) : (
                                    item.ddValue.toString()
                                )}
                            </div>
                            <div>
                                {(isEditingValue || isLoadingTxUpdate) && selectedItem === item ? (
                                    <>
                                        <button onClick={() => handleBtnUpdateTx(item)}>
                                            Save{' '}
                                            {item === selectedItem && isLoadingTxUpdate && (
                                                <>
                                                    <LoaderButton></LoaderButton>
                                                </>
                                            )}
                                        </button>
                                        {isLoadingTxUpdate === false && <button onClick={() => finishEditing()}>Cancel</button>}
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => startEditing(item)}>Update</button>
                                        <button onClick={() => handleBtnClaimTx(item)}>
                                            Claim
                                            {item === selectedItem && isLoadingTxClaim && (
                                                <>
                                                    <LoaderButton></LoaderButton>
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.gap}></div>
            <Modal
                isOpen={isTxModalOpen}
                onRequestClose={() => setIsTxModalOpen(false)}
                contentLabel="Transaction Status"
                className={styles.modal}
                overlayClassName={styles.overlay}
            >
                <h2>Transaction Status</h2>
                <div>
                    <textarea value={txMessage} style={{ resize: 'none' }}></textarea>
                </div>
                <div>
                    Tx Hash: <div className={styles.txHash}>{txHash}</div>
                </div>
                <div>
                    Status: <div className={styles.txStatus}>{txConfirmed ? 'Confirmed' : isTxError ? 'Error' : 'Waiting...'}</div>
                </div>
                <button onClick={() => setIsTxModalOpen(false)}>Close</button>
            </Modal>
            <Modal
                isOpen={isWalletConnectorModalOpen}
                onRequestClose={() => setIsWalletConnectorModalOpen(false)}
                contentLabel="Connect Wallet"
                className={styles.modal}
                overlayClassName={styles.overlay}
            >
                <h2>Connect Wallet</h2>
                <div>
                    <textarea value={txMessage} style={{ resize: 'none' }}></textarea>
                </div>
                <div>
                    Tx Hash: <div className={styles.txHash}>{txHash}</div>
                </div>
                <div>
                    Status: <div className={styles.txStatus}>{txConfirmed ? 'Confirmed' : isTxError ? 'Error' : 'Waiting...'}</div>
                </div>
                <button onClick={() => setIsTxModalOpen(false)}>Close</button>
            </Modal>
        </div>
    );
}
