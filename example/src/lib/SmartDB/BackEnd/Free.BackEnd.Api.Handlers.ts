import { Address, Assets, MintingPolicy, OutRef, SpendingValidator, Tx } from 'lucid-cardano';
import { NextApiResponse } from 'next';
import { createErrorObject, getOutRef, SmartUTxOEntity, TRANSACTION_STATUS_CREATED } from 'smart-db';
import {
    BackEndApiHandlersFor,
    BackEndAppliedFor,
    BaseSmartDBBackEndApiHandlers,
    BaseSmartDBBackEndApplied,
    BaseSmartDBBackEndMethods,
    CS,
    LucidToolsBackEnd,
    NextApiRequestAuthenticated,
    SmartUTxOBackEndApplied,
    TRANSACTION_STATUS_PENDING,
    TimeBackEnd,
    TransactionBackEndApplied,
    TransactionDatum,
    TransactionEntity,
    TransactionRedeemer,
    WalletTxParams,
    addAssetsList,
    calculateMinAdaOfUTxO,
    console_error,
    console_log,
    isEmulator,
    objToCborHex,
    optionsGetMinimalWithSmartUTxOCompleteFields,
    sanitizeForDatabase,
    showData,
    strToHex,
    walletTxParamsSchema,
    yup,
} from 'smart-db/backEnd';
import {
    ClaimFreeTxParams,
    CreateFreeTxParams,
    FREE_CLAIM,
    FREE_CREATE,
    FREE_UPDATE,
    UpdateFreeTxParams,
    createFreeTxParamsSchema,
    updateFreeTxParamsSchema,
} from '../../Commons/Constants/transactions';
import { FreeEntity } from '../Entities/Free.Entity';
import { FreePolicyRedeemerBurnID, FreePolicyRedeemerMintID, FreeValidatorRedeemerClaim, FreeValidatorRedeemerDatumUpdate } from '../Entities/Redeemers/Free.Redeemer';

@BackEndAppliedFor(FreeEntity)
export class FreeBackEndApplied extends BaseSmartDBBackEndApplied {
    protected static _Entity = FreeEntity;
    protected static _BackEndMethods = BaseSmartDBBackEndMethods;
}

@BackEndApiHandlersFor(FreeEntity)
export class FreeApiHandlers extends BaseSmartDBBackEndApiHandlers {
    protected static _Entity = FreeEntity;
    protected static _BackEndApplied = FreeBackEndApplied;

    // #region scripts

    protected static cborHexMintingID =
        '590b63590b600100003232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232223232323253353355333573460720022642446004006a666ae68c0dcd55ce9baa357426aae780080440d454ccd5cd181c0008990911800801a999ab9a303735573a6ea8d5d09aab9e0020110350352325335533500102c2213335530260383303022333013037002001301102f23500122333573466e20005200003701500302b1335738921236e6f742069734275726e696e67416c6c546f6b656e4f776e4353416e79416d6f756e7400010350042235002222222222222323304b2253350011302102022135002225333573466e3c00801c4c094c0d80044c01800c024c07c04894cd4cc094d401088d4008888888888888c8c8cc130894cd40044c00c084884d4008894ccd5cd19b8f0020081300730370011300600300a233335530330453303d22333501f0440010023501d03c223355303404723500122330420023355303704a2350012233045002333500137009000380233700002900000099aa981a02391a8009119821001199a800919aa981c02591a800911982300118120008009119981000f801000919aa981c02591a8009119823001181280080099980d80d00080119aa981902291a80091198231982000299823198200010008220221810000998219981ea4500330433303d48810048000104104c07c048cc0cccc0b4c044010cc0cccc0b52210646726565494400480080c40c40a84cd5ce24811d6e6f74206973436f72726563744d696e745f416e645f4f7574707574730000f0111635573a0026ea80114ccd5cd181a1aab9d0011323232321233001003002301a357426ae8800d4ccd5cd181b1aab9d00113232323232323232323232323232323232323232323232321233333333333300101801601401201000e00c0090070050030023035357426ae88008ccc0b5d710009aba10013574400466605605a40026ae84004d5d1001198153ae357420026ae8800d4ccd5cd18231aab9d0011323232323212330010040025333573460946aae740044c8c8c848cc00400c008c09cd5d09aba20023302775a6ae84004d55cf0008241baa357426ae8800d4ccd5cd18241aab9d001132323212330010030023025357426ae88008cc095d69aba100135573c00208c6ea8d5d08009aab9e00104437546ae84004d5d10011998120143ad357420026ae88008cc08c094d5d08009aba200233302075c03e6ae84004d5d100119980f3ae01d357420026ae88008cc074064d5d08009aba20023301b016357420026ae88008cc064050d5d08009aab9e00103437546ae84004d55cf0008191baa00122333573466e3c0080040ac024888ccd54c0b80bc0b4cd54c0700bc8d400488cc0a8008c020004ccd54c0b80bc88d4008894cd4ccd54c0840cccc0ac88ccc0280c8008004c0200a88d400488cc028008014018400c4cc0c401000c0ac004cd54c0700bc8d400488cc0a8008cc0e4894cd40044c02c00c884d4008894cd4cc03000802044888cc0080280104c01800c0100088cc004894cd400808c400401884888c00c01084888c004010cc080888c00cc00800480048cc004894cd40084004080090407494cd40048400454cd5ce24810866726f6d4a75737400162350012233335001029200102902910232325333573460500020322a666ae68c09c004068094d55ce9baa001223232533357346054002224440022a666ae68c0a40044c84888c00c010c010d5d09aab9e00215333573460500022244400404c6aae74004dd50009192999ab9a302535573a00226464642466002006004600a6ae84d5d100118069aba100135573c0020466ea80048c94ccd5cd18121aab9d0011323232323232323232321233330010090070030023300c75c6ae84d5d10022999ab9a302e00113212223002004357426aae7800854ccd5cd1816800899091118008021bae357426aae7800854ccd5cd1816000889110018151aab9d00137546ae84004d5d1001199804bae008357420026ae8800d4ccd5cd18131aab9d001132323212330010030023300700d357426ae88008c034d5d08009aab9e00102437546ae84004d55cf0008111baa00122323253335734604a0022601c60086ae84d55cf0010a999ab9a302600101802335573a0026ea8004cc005d73ad222330262233335573e002403c4646604266036600e6aae74004c018d55cf00098021aba2003357420040426eac00488cc09088cccd55cf800900e11980f18029aba100230033574400403e6eb00048c8c94ccd5cd181180089909111180200298021aba135573c0042a666ae68c0880044c848888c008014c014d5d09aab9e002153335734604200226424444600200a600e6ae84d55cf0010a999ab9a3020001132122223003005375c6ae84d55cf00100f1aab9d00137540024646464a666ae68cdc3a40180042244444440062a666ae68cdc3a40140042244444440082a666ae68cdc3a40100042646424444444660020120106eb4d5d09aba25002375c6ae85400454ccd5cd18118010991909111111198010048041bae357426ae894008dd71aba15001153335734604400426464244444446600c0120106eb8d5d09aba25002300535742a0022a666ae68c0840084c848888888c01c020c014d5d09aab9e003153335734604000426424444444600a010600a6ae84d55cf00180f09aab9e00235573a0026ea80048c8c94ccd5cd180f800899191919190911998008030020019bad357426ae88008dd69aba1001357440046eb4d5d08009aab9e002153335734603c002264244600400660086ae84d55cf00100e1aab9d001375400246464a666ae68c0780044c8488c00400cdd71aba135573c0042a666ae68c0740044c8488c00800cdd71aba135573c0040366aae74004dd50009192999ab9a301b35573a002264646424660020060046eb4d5d09aba20023004357420026aae78004064dd50009192999ab9a301a35573a00226eb8d5d09aab9e0010183754002424460040066034442244a66a0020184426602e600800466aa600c03200800260324422444a66a00226a00601c442666a00a02c6008004666aa600e03200a0080026a0040106a00201a601024446600644a66a0042a66a0020124426a00444a66a6601602800226601002800601c4426a00444a66a00a2a66a6601600202826601000602801c4426a00444a666ae68cdc78030010a99a99807802800899806003801809099998059980a003002803980b891198011980b00200180080191111a80211299a8018a99a9980580080a0998040028020071109a801112999ab9a3371e00c0042a66a6601e00a002266018012666aa6036038034006010024266660166602800c00a01266034660280040020100066a00400a6a002014600a24446600644a66a0042a66a00200c4426a00444a666ae68c0600044cc02004400c02c884d4008894cd401454ccd5cd180c0008998040018088059109a80111192999ab9a301d00613300d0083301833012003002004153335734603a00426601a660306602400e00c0100082a666ae68cdc78038018a999ab9a3370e00c00426601a010008002002266660166602200c00a00e6028244660046602600800600200644446a00844a66a0060164426a00444a666ae68c0700044cccc02ccc04401801402402000c54ccd5cd19b8f00600215333573466e1c0140044cc030024ccd54c06006405c00c0204cccc02ccc044018014024cc05ccc04400800402000c4cccc02ccc044018014024cc05ccc04400800402000c401c44004880048848cc00400c0088cc00800800488c8c848cc0048c00c88c00800c8c00c88c00400c8d4c00800cd400c004c0080088cd400401000840048800888488cc00401000cc02088448894cd40044008884cc014008ccd54c01c0200140100044800454cd5ce2481035054310016253357389201024c680016370e90001b8748008dc3a40086e1d200623230010012233003300200200101';
    protected static cborHexValidator =
        '5906235906200100003232323232323232323232323232323232323232323232323222232323232533553355333573466e3d22011c6d37327af01be275ba3b9819dbf526ed7ca770ad7c58659ff40bc90a0048810001a0180181335738920100122001112001165333573460366aae740044c94ccd5cd180e1aab9d0011375a6ae84d55cf00080d9baa357426aae78004068dd50029aa999ab9a301935573a002264646464246600200600460246ae84d5d1001a999ab9a301b35573a00226464646464646464646464646464646464646464646464642466666666666600203002c02802402001c01801200e00a006004605a6ae84d5d1001199811bae2001357420026ae88008ccc0840948004d5d08009aba20023302075c6ae84004d5d1001a999ab9a302b35573a002264646464642466002008004a666ae68c0bcd55ce80089919190919800801801180e9aba1357440046603aeb4d5d08009aab9e00102e37546ae84d5d1001a999ab9a302d35573a0022646464246600200600460366ae84d5d10011980dbad357420026aae780040b0dd51aba100135573c0020546ea8d5d08009aba200233301a02075a6ae84004d5d10011980c80e9aba10013574400466602ceb8054d5d08009aba200233301475c0266ae84004d5d1001198098079aba100135744004660220186ae84004d5d1001198078051aba100135573c0020346ea8d5d08009aab9e001018220023754002464a666ae68c05c00404854ccd5cd180b00080a00a9aab9d3754002446464a666ae68c0640044488800454ccd5cd180c0008990911180180218021aba135573c0042a666ae68c05c00444888008058d55ce8009baa0012325333573460286aae740044c8c8c848cc00400c008c014d5d09aba2002300f357420026aae7800404cdd50009192999ab9a301335573a00226464646464646464646424666600201200e00600466018eb8d5d09aba200453335734603a002264244460040086ae84d55cf0010a999ab9a301c00113212223001004375c6ae84d55cf0010a999ab9a301b0011122200301a35573a0026ea8d5d08009aba200233300975c0106ae84004d5d1001a999ab9a301535573a002264646424660020060046600e01e6ae84d5d100118079aba100135573c0020286ea8d5d08009aab9e0010123754002446464a666ae68c0500044c8488c00800cc010d5d09aab9e002153335734602a0020240266aae74004dd500099800bae75a4446602a446666aae7c00480448c8c8c8cc03048cc00400c008c018d5d100298039aab9e002300735573a0026ae8400801cdd58009119809911999aab9f001200f23300730053574200460066ae88008014dd6000890009109119800802001919192999ab9a30100011321222230040053004357426aae7800854ccd5cd180780089909111180100298029aba135573c0042a666ae68c0380044c848888c004014c01cd5d09aab9e002153335734601a00226424444600600a6eb8d5d09aab9e00200c35573a0026ea80048c8c8c94ccd5cd19b874803000844888888800c54ccd5cd19b874802800844888888801054ccd5cd19b87480200084c8c848888888cc004024020dd69aba135744a0046eb8d5d0a8008a999ab9a3010002132321222222233002009008375c6ae84d5d128011bae35742a0022a666ae68c03c0084c8c848888888cc018024020dd71aba135744a004600a6ae85400454ccd5cd180700109909111111180380418029aba135573c0062a666ae68c0340084c848888888c014020c014d5d09aab9e00300c135573c0046aae74004dd5000919192999ab9a300c00113232323232122333001006004003375a6ae84d5d10011bad357420026ae88008dd69aba100135573c0042a666ae68c02c0044c8488c00800cc010d5d09aab9e00200a35573a0026ea80048c8c94ccd5cd180580089909118008019bae357426aae7800854ccd5cd180500089909118010019bae357426aae78008024d55ce8009baa0012325333573460106aae740044c8c8c848cc00400c008dd69aba13574400460086ae84004d55cf0008039baa00123253335734600e6aae740044dd71aba135573c00200c6ea80044004488008448800454cd5ce249035054310016370e90001b8748008dc3a40086e1d200623230010012233003300200200101';
    protected static mintingIdFree: MintingPolicy = {
        type: 'PlutusV2',
        script: FreeApiHandlers.cborHexMintingID,
    };
    protected static validatorFree: SpendingValidator = {
        type: 'PlutusV2',
        script: FreeApiHandlers.cborHexValidator,
    };

    // #endregion scripts

    // #region custom api handlers

    protected static _ApiHandlers: string[] = ['tx'];

    protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        const { query } = req.query;
        //--------------------
        if (this._ApiHandlers.includes(command) && query !== undefined) {
            if (query[0] === 'tx') {
                if (query.length === 2) {
                    if (query[1] === 'create-free-tx') {
                        return await this.createTxApiHandler(req, res);
                    } else if (query[1] === 'claim-free-tx') {
                        return await this.claimTxApiHandler(req, res);
                    } else if (query[1] === 'update-free-tx') {
                        return await this.updateTxApiHandler(req, res);
                    }
                }
                return res.status(405).json({ error: 'Wrong Api route' });
            } else {
                console_error(0, this._Entity.className(), `executeApiHandlers - Error: Api Handler function not found`);
                return res.status(500).json({ error: 'Api Handler function not found ' });
            }
        } else {
            console_error(0, this._Entity.className(), `executeApiHandlers - Error: Wrong Custom Api route`);
            return res.status(405).json({ error: 'Wrong Custom Api route ' });
        }
    }

    // #region api tx handlers

    public static async createTxApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        if (req.method === 'POST') {
            console_log(1, this._Entity.className(), `Create Tx - POST - Init`);
            try {
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape({
                    walletTxParams: walletTxParamsSchema,
                    txParams: createFreeTxParamsSchema,
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `Create Tx - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { txParams, walletTxParams }: { txParams: CreateFreeTxParams; walletTxParams: WalletTxParams } = validatedBody;
                //--------------------------------------
                console_log(0, this._Entity.className(), `Create Tx - txParams: ${showData(txParams)}`);
                //--------------------------------------
                if (isEmulator) {
                    // solo en emulator. Me aseguro de setear el emulador al tiempo real del server. Va a saltear los slots necesarios.
                    // await TimeBackEnd.syncBlockChainWithServerTime()
                }
                //--------------------------------------
                const { lucid } = await LucidToolsBackEnd.prepareLucidBackEndForTx(walletTxParams);
                //--------------------------------------
                const { utxos: uTxOsAtWallet, address } = walletTxParams;
                //--------------------------------------
                const {} = txParams;
                //--------------------------------------
                const freeID_CS: CS = lucid.utils.mintingPolicyToId(this.mintingIdFree);
                const freeID_TN = 'FreeID';
                console_log(0, this._Entity.className(), `Create Tx - freeID_CS: ${freeID_CS}`);
                //----------------------------
                const validatorAddress: Address = lucid.utils.validatorToAddress(this.validatorFree);
                console_log(0, this._Entity.className(), `Create Tx - validatorAddress: ${validatorAddress}`);
                //----------------------------
                const { now, from, until } = await TimeBackEnd.getTxTimeRange();
                console_log(0, this._Entity.className(), `Create Tx - from ${from} to ${until}`);
                //--------------------------------------
                let transaction: TransactionEntity | undefined = undefined;
                //--------------------------------------
                try {
                    //--------------------------------------
                    // NOTE: leer nota abajo
                    //--------------------------------------
                    const reading_UTxOs: OutRef[] = [];
                    const consuming_UTxOs: OutRef[] = [];
                    //--------------------------------------
                    const transaction_ = new TransactionEntity({
                        paymentPKH: walletTxParams.pkh,
                        date: new Date(now),
                        type: FREE_CREATE,
                        status: TRANSACTION_STATUS_CREATED,
                        reading_UTxOs,
                        consuming_UTxOs,
                    });
                    //--------------------------------------
                    transaction = await TransactionBackEndApplied.create(transaction_);
                    //--------------------------------------
                    const lucidAC_MintID = freeID_CS + strToHex(freeID_TN);
                    const valueFor_Mint_ID: Assets = { [lucidAC_MintID]: 1n };
                    console_log(0, this._Entity.className(), `Create Tx - valueFor_Mint_ID: ${showData(valueFor_Mint_ID)}`);
                    //----------------------------
                    let valueFor_FreeDatum_Out: Assets = valueFor_Mint_ID;
                    const minADA_For_FreeDatum = calculateMinAdaOfUTxO({ assets: valueFor_FreeDatum_Out });
                    const value_MinAda_For_FreeDatum: Assets = { lovelace: minADA_For_FreeDatum };
                    valueFor_FreeDatum_Out = addAssetsList([value_MinAda_For_FreeDatum, valueFor_FreeDatum_Out]);
                    console_log(0, this._Entity.className(), `Create Tx - valueFor_FundDatum_Out: ${showData(valueFor_FreeDatum_Out, false)}`);
                    //--------------------------------------
                    const datumPlainObject = {
                        fdValue: BigInt(0),
                    };
                    //--------------------------------------
                    let freeDatum_Out = FreeEntity.mkDatumFromPlainObject(datumPlainObject);
                    console_log(0, this._Entity.className(), `Create Tx - freeDatum_Out: ${showData(freeDatum_Out, false)}`);
                    const freeDatum_Out_Hex = FreeEntity.datumToCborHex(freeDatum_Out);
                    console_log(0, this._Entity.className(), `Create Tx - freeDatum_Out_Hex: ${showData(freeDatum_Out_Hex, false)}`);
                    //--------------------------------------
                    const freePolicyRedeemerMintID = new FreePolicyRedeemerMintID();
                    console_log(0, this._Entity.className(), `Create Tx - freePolicyRedeemerMintID: ${showData(freePolicyRedeemerMintID, false)}`);
                    const freePolicyRedeemerMintID_Hex = objToCborHex(freePolicyRedeemerMintID);
                    console_log(0, this._Entity.className(), `Create Tx - freePolicyRedeemerMintID_Hex: ${showData(freePolicyRedeemerMintID_Hex, false)}`);
                    //--------------------------------------
                    let tx: Tx = lucid.newTx();
                    //--------------------------------------
                    tx = await tx
                        .mintAssets(valueFor_Mint_ID, freePolicyRedeemerMintID_Hex)
                        .payToContract(validatorAddress, { inline: freeDatum_Out_Hex }, valueFor_FreeDatum_Out)
                        .attachMintingPolicy(this.mintingIdFree);
                    //--------------------------------------
                    const txComplete = await tx.complete();
                    //--------------------------------------
                    const txCborHex = txComplete.toString();
                    //--------------------------------------
                    const txHash = txComplete.toHash();
                    //--------------------------------------
                    const transactionFreePolicyRedeemerMintID: TransactionRedeemer = {
                        tx_index: 0,
                        purpose: 'mint',
                        redeemerObj: freePolicyRedeemerMintID,
                    };
                    //--------------------------------------
                    const transactionFreeDatum_Out: TransactionDatum = {
                        address: validatorAddress,
                        datumType: FreeEntity.className(),
                        datumObj: freeDatum_Out,
                    };
                    //--------------------------------------
                    await TransactionBackEndApplied.setPendingTransaction(transaction, {
                        hash: txHash,
                        ids: {},
                        redeemers: {
                            freePolicyRedeemerMintID: transactionFreePolicyRedeemerMintID,
                        },
                        datums: { freeDatum_Out: transactionFreeDatum_Out },
                    });
                    //--------------------------------------
                    console_log(-1, this._Entity.className(), `Create Tx - txHash: ${txHash} - txCborHex: ${showData(txCborHex)}`);
                    return res.status(200).json({ txHash, txCborHex });
                    //--------------------------------------
                } catch (error) {
                    //--------------------------------------
                    // NOTE: si existe la transaccion, la elimino
                    // con esto libero los utxos
                    if (transaction !== undefined) {
                        await TransactionBackEndApplied.delete(transaction);
                    }
                    //--------------------------------------
                    throw error;
                }
            } catch (error) {
                console_error(-1, this._Entity.className(), `Create Tx - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while creating the ${this._Entity.apiRoute()} Create Tx: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `Create Tx - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async claimTxApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        if (req.method === 'POST') {
            console_log(1, this._Entity.className(), `Claim Tx - POST - Init`);
            try {
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const { walletTxParams, txParams }: { walletTxParams: WalletTxParams; txParams: ClaimFreeTxParams } = sanitizedBody;
                //--------------------------------------
                console_log(0, this._Entity.className(), `Claim Tx - txParams: ${showData(txParams)}`);
                //--------------------------------------
                if (isEmulator) {
                    // solo en emulator. Me aseguro de setear el emulador al tiempo real del server. Va a saltear los slots necesarios.
                    // await TimeBackEnd.syncBlockChainWithServerTime()
                }
                //--------------------------------------
                const { lucid } = await LucidToolsBackEnd.prepareLucidBackEndForTx(walletTxParams);
                //--------------------------------------
                const { utxos: uTxOsAtWallet, address } = walletTxParams;
                //--------------------------------------
                // const { freeID_CS, freeID_TN, mintingIdFree, validatorFree, free_id } = txParams;
                const { free_ids } = txParams;
                //--------------------------------------
                const freeID_CS: CS = lucid.utils.mintingPolicyToId(this.mintingIdFree);
                const freeID_TN = 'FreeID';
                console_log(0, this._Entity.className(), `Claim Tx - freeID_CS: ${freeID_CS}`);
                //----------------------------
                const validatorAddress: Address = lucid.utils.validatorToAddress(this.validatorFree);
                console_log(0, this._Entity.className(), `Claim Tx - validatorAddress: ${validatorAddress}`);
                //--------------------------------------
                const { now, from, until } = await TimeBackEnd.getTxTimeRange();
                console_log(0, this._Entity.className(), `Claim Tx - from ${from} to ${until}`);
                //--------------------------------------
                let transaction: TransactionEntity | undefined = undefined;
                //--------------------------------------
                try {
                    //--------------------------------------
                    // NOTE: este bloque try crea una transaccion temporal y ya la guarda en la base de datos
                    // al existir una transaccion con reading o consuming utxos esos utxos quedan separados y evita que se usen en otra transaccion
                    // si hay algun error en la creacion de la transaccion se elimina de la base de datos y con eso se liberan los utxos
                    // Esto soluciona el problema de una concurrencia muy simultanea. En esos casos antes pasaba que encontraba utxo libres y no las marcaba al momento, si no recien al final al guardar la transaccion
                    // al ser tan simultaneo, otro proceso podia encontrar los mismos utxos libres y usarlos antes de que se marquen como consumidos
                    // Ahora me aseguro que al encontrar los utxos libres, ya los marco como consumidos
                    //--------------------------------------
                    const free_SmartUTxOs = await Promise.all(
                        free_ids.map(async (free_id) => {
                            const freeEntity = await FreeBackEndApplied.getById_<FreeEntity>(free_id, {
                                ...optionsGetMinimalWithSmartUTxOCompleteFields,
                            });
                            if (freeEntity === undefined) {
                                throw `Invalid free id: ${free_id}`;
                            }
                            const free_SmartUTxO = freeEntity.smartUTxO;
                            if (free_SmartUTxO === undefined) {
                                throw `Can't find Free UTxO for id: ${free_id}`;
                            }
                            const available = await SmartUTxOBackEndApplied.isAvailableForConsuming(free_SmartUTxO);
                            if (available === false) {
                                throw `Free UTxO for id: ${free_id} is being used, please wait and try again`;
                            }
                            return free_SmartUTxO;
                        })
                    );
                    //--------------------------------------
                    const reading_UTxOs: OutRef[] = [];
                    const consuming_UTxOs: OutRef[] = free_SmartUTxOs.map((free_SmartUTxO) => free_SmartUTxO.getOutRef());
                    //--------------------------------------
                    const transaction_ = new TransactionEntity({
                        paymentPKH: walletTxParams.pkh,
                        date: new Date(now),
                        type: FREE_CLAIM,
                        status: TRANSACTION_STATUS_CREATED,
                        reading_UTxOs,
                        consuming_UTxOs,
                    });
                    //--------------------------------------
                    transaction = await TransactionBackEndApplied.create(transaction_);
                    //--------------------------------------
                    const free_UTxOs = free_SmartUTxOs.map((free_SmartUTxO) => free_SmartUTxO.getUTxO());
                    //--------------------------------------
                    const lucidAC_BurnID = freeID_CS + strToHex(freeID_TN);
                    const valueFor_Burn_ID: Assets = { [lucidAC_BurnID]: -1n };
                    console_log(0, this._Entity.className(), `Claim Tx - valueFor_Burn_ID: ${showData(valueFor_Burn_ID)}`);
                    //----------------------------
                    const freePolicyRedeemerBurnID = new FreePolicyRedeemerBurnID();
                    console_log(0, this._Entity.className(), `Claim Tx - freePolicyRedeemerBurnID: ${showData(freePolicyRedeemerBurnID, false)}`);
                    const freePolicyRedeemerBurnID_Hex = objToCborHex(freePolicyRedeemerBurnID);
                    console_log(0, this._Entity.className(), `Claim Tx - freePolicyRedeemerBurnID_Hex: ${showData(freePolicyRedeemerBurnID_Hex, false)}`);
                    //--------------------------------------
                    const freeValidatorRedeemerClaim = new FreeValidatorRedeemerClaim();
                    console_log(0, this._Entity.className(), `Claim Tx - freeValidatorRedeemerClaim: ${showData(freeValidatorRedeemerClaim, false)}`);
                    const freeValidatorRedeemerClaim_Hex = objToCborHex(freeValidatorRedeemerClaim);
                    console_log(0, this._Entity.className(), `Claim Tx - freeValidatorRedeemerClaim_Hex: ${showData(freeValidatorRedeemerClaim_Hex, false)}`);
                    //--------------------------------------
                    let tx: Tx = lucid.newTx();
                    //--------------------------------------
                    tx = await tx
                        .mintAssets(valueFor_Burn_ID, freePolicyRedeemerBurnID_Hex)
                        .collectFrom(free_UTxOs, freeValidatorRedeemerClaim_Hex)
                        .attachMintingPolicy(this.mintingIdFree)
                        .attachSpendingValidator(this.validatorFree)
                        .addSigner(address);
                    //----------------------------
                    const txComplete = await tx.complete();
                    //--------------------------------------
                    const txCborHex = txComplete.toString();
                    //--------------------------------------
                    const txHash = txComplete.toHash();
                    //--------------------------------------
                    const transactionFreePolicyRedeemerBurnID: TransactionRedeemer = {
                        tx_index: 0,
                        purpose: 'mint',
                        redeemerObj: freePolicyRedeemerBurnID,
                    };
                    //--------------------------------------
                    const transactionFreeValidatorRedeemerClaim: TransactionRedeemer = {
                        tx_index: 0,
                        purpose: 'spend',
                        redeemerObj: freeValidatorRedeemerClaim,
                    };
                    //--------------------------------------
                    const transactionFreeDatums_In: TransactionDatum[] = free_SmartUTxOs.map((free_SmartUTxO) => {
                        return {
                            address: free_SmartUTxO.address,
                            datumType: FreeEntity.className(),
                            datumObj: free_SmartUTxO.datumObj,
                        };
                    });
                    //--------------------------------------
                    const datums = transactionFreeDatums_In.reduce((acc, datum, index) => {
                        acc[`freeDatum_In${index}`] = datum;
                        return acc;
                    }, {} as Record<string, TransactionDatum>);
                    //--------------------------------------
                    await TransactionBackEndApplied.setPendingTransaction(transaction, {
                        hash: txHash,
                        ids: {},
                        redeemers: {
                            freePolicyRedeemerBurnID: transactionFreePolicyRedeemerBurnID,
                            freeValidatorRedeemerClaim: transactionFreeValidatorRedeemerClaim,
                        },
                        datums,
                    });
                    //--------------------------------------
                    console_log(-1, this._Entity.className(), `Claim Tx - txHash: ${txHash} - txCborHex: ${showData(txCborHex)}`);
                    return res.status(200).json({ txHash, txCborHex });
                    //--------------------------------------
                } catch (error) {
                    //--------------------------------------
                    // NOTE: si existe la transaccion, la elimino
                    // con esto libero los utxos
                    if (transaction !== undefined) {
                        await TransactionBackEndApplied.delete(transaction);
                    }
                    //--------------------------------------
                    throw error;
                }
            } catch (error) {
                console_error(-1, this._Entity.className(), `Claim Tx - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while creating the ${this._Entity.apiRoute()} Claim Tx: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `Claim Tx - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async updateTxApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        if (req.method === 'POST') {
            console_log(1, this._Entity.className(), `Update Tx - POST - Init`);
            try {
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape({
                    walletTxParams: walletTxParamsSchema,
                    txParams: updateFreeTxParamsSchema,
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `Update Tx - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { walletTxParams, txParams }: { walletTxParams: WalletTxParams; txParams: UpdateFreeTxParams } = validatedBody;
                //--------------------------------------
                console_log(0, this._Entity.className(), `Update Tx - txParams: ${showData(txParams)}`);
                //--------------------------------------
                if (isEmulator) {
                    // solo en emulator. Me aseguro de setear el emulador al tiempo real del server. Va a saltear los slots necesarios.
                    // await TimeBackEnd.syncBlockChainWithServerTime()
                }
                //--------------------------------------
                const { lucid } = await LucidToolsBackEnd.prepareLucidBackEndForTx(walletTxParams);
                //--------------------------------------
                const { utxos: uTxOsAtWallet, address } = walletTxParams;
                //--------------------------------------
                const { valueToAdd, useSmartSelection, useRead } = txParams;
                //--------------------------------------
                const freeID_CS: CS = lucid.utils.mintingPolicyToId(this.mintingIdFree);
                const freeID_TN = 'FreeID';
                console_log(0, this._Entity.className(), `Update Tx - freeID_CS: ${freeID_CS}`);
                //----------------------------
                const validatorAddress: Address = lucid.utils.validatorToAddress(this.validatorFree);
                console_log(0, this._Entity.className(), `Update Tx - validatorAddress: ${validatorAddress}`);
                //--------------------------------------
                const lucidAC_ID = freeID_CS + strToHex(freeID_TN);
                const valueFor_ID: Assets = { [lucidAC_ID]: 1n };
                console_log(0, this._Entity.className(), `Update Tx - valueFor_ID: ${showData(valueFor_ID)}`);
                //--------------------------------------
                const { now, from, until } = await TimeBackEnd.getTxTimeRange();
                console_log(0, this._Entity.className(), `Update Tx - from ${from} to ${until}`);
                //--------------------------------------
                let transaction: TransactionEntity | undefined = undefined;
                //--------------------------------------
                try {
                    //--------------------------------------
                    const freeEntities: FreeEntity[] = await FreeBackEndApplied.getAll_({
                        ...optionsGetMinimalWithSmartUTxOCompleteFields,
                    });
                    //--------------------------------------
                    if (freeEntities.length === 0) {
                        throw `Can't find freeEntities`;
                    }
                    //--------------------------------------
                    let freeEntity = freeEntities[0];
                    let free_SmartUTxO = freeEntity.smartUTxO;
                    //--------------------------------------
                    let read_freeEntity: FreeEntity | undefined = undefined;
                    let read_free_SmartUTxO: SmartUTxOEntity | undefined = undefined;
                    //--------------------------------------
                    if (freeEntities.length > 0 && useRead !== false) {
                        read_freeEntity = freeEntities[1];
                        read_free_SmartUTxO = read_freeEntity.smartUTxO;
                    }
                    //--------------------------------------
                    if (useSmartSelection !== false) {
                        //--------------------------------------
                        const free_SmartUTxOs = freeEntities.map((freeEntity) => freeEntity.smartUTxO).filter((smartUTxO): smartUTxO is SmartUTxOEntity => smartUTxO !== undefined);
                        //--------------------------------------
                        if (free_SmartUTxOs.length === 0) {
                            throw `Can't find Free UTxOs`;
                        }
                        //--------------------------------------
                        const free_SmartUTxOsAvailables = await SmartUTxOBackEndApplied.getAvailablesForConsuming(free_SmartUTxOs);
                        //--------------------------------------
                        if (free_SmartUTxOsAvailables.length === 0) {
                            throw `freeEntity UTxOs are being used, please wait and try again`;
                        }
                        //--------------------------------------
                        free_SmartUTxO = free_SmartUTxOsAvailables[0];
                        //--------------------------------------
                        if (useRead !== false) {
                            //--------------------------------------
                            const free_SmartUTxOsAvailablesForRead = await SmartUTxOBackEndApplied.getAvailablesForReading(
                                free_SmartUTxOs.filter((smartUTxO) => smartUTxO !== free_SmartUTxO)
                            );
                            //--------------------------------------
                            if (free_SmartUTxOsAvailablesForRead.length === 0) {
                                throw `freeEntity UTxOs are being used, please wait and try again`;
                            }
                            //--------------------------------------
                            read_free_SmartUTxO = free_SmartUTxOsAvailablesForRead[0];
                            //--------------------------------------
                        }
                        //--------------------------------------
                    }
                    //--------------------------------------
                    if (free_SmartUTxO === undefined) {
                        throw `Can't find Free UTxO`;
                    }
                    //--------------------------------------
                    const reading_UTxOs: OutRef[] = read_free_SmartUTxO !== undefined ? [read_free_SmartUTxO.getOutRef()] : [];
                    const consuming_UTxOs: OutRef[] = [free_SmartUTxO.getOutRef()];
                    //--------------------------------------
                    const transaction_ = new TransactionEntity({
                        paymentPKH: walletTxParams.pkh,
                        date: new Date(now),
                        type: FREE_UPDATE,
                        status: TRANSACTION_STATUS_CREATED,
                        reading_UTxOs,
                        consuming_UTxOs,
                    });
                    //--------------------------------------
                    transaction = await TransactionBackEndApplied.create(transaction_);
                    //--------------------------------------
                    const free_UTxO = free_SmartUTxO.getUTxO();
                    //--------------------------------------
                    const datumPlainObject = {
                        fdValue: freeEntity.fdValue + BigInt(valueToAdd),
                    };
                    //--------------------------------------
                    let valueFor_FreeDatum_Out = free_SmartUTxO.assets;
                    //--------------------------------------
                    let freeDatum_Out = FreeEntity.mkDatumFromPlainObject(datumPlainObject);
                    console_log(0, this._Entity.className(), `Update Tx - freeDatum_Out: ${showData(freeDatum_Out, false)}`);
                    const freeDatum_Out_Hex = FreeEntity.datumToCborHex(freeDatum_Out);
                    console_log(0, this._Entity.className(), `Update Tx - freeDatum_Out_Hex: ${showData(freeDatum_Out_Hex, false)}`);
                    //--------------------------------------
                    const freeValidatorRedeemerDatumUpdate = new FreeValidatorRedeemerDatumUpdate();
                    console_log(0, this._Entity.className(), `Update Tx - freeValidatorRedeemerDatumUpdate: ${showData(freeValidatorRedeemerDatumUpdate, false)}`);
                    const freeValidatorRedeemerDatumUpdate_Hex = objToCborHex(freeValidatorRedeemerDatumUpdate);
                    console_log(0, this._Entity.className(), `Update Tx - freeValidatorRedeemerDatumUpdate_Hex: ${showData(freeValidatorRedeemerDatumUpdate_Hex, false)}`);
                    //--------------------------------------
                    let tx: Tx = lucid.newTx();
                    //--------------------------------------
                    tx = await tx
                        .collectFrom([free_UTxO], freeValidatorRedeemerDatumUpdate_Hex)
                        .payToContract(validatorAddress, { inline: freeDatum_Out_Hex }, valueFor_FreeDatum_Out)
                        .attachSpendingValidator(this.validatorFree)
                        .addSigner(address);
                    //--------------------------------
                    if (useRead !== false && read_free_SmartUTxO !== undefined ) {
                        const read_free_UTxO = read_free_SmartUTxO.getUTxO();
                        tx = tx.readFrom([read_free_UTxO])
                    }
                    //--------------------------------------
                    const txComplete = await tx.complete();
                    //--------------------------------------
                    const txCborHex = txComplete.toString();
                    //--------------------------------------
                    const txHash = txComplete.toHash();
                    //--------------------------------------
                    const transactionFreeValidatorRedeemerDatumUpdate: TransactionRedeemer = {
                        tx_index: 0,
                        purpose: 'spend',
                        redeemerObj: freeValidatorRedeemerDatumUpdate,
                    };
                    //--------------------------------------
                    const transactionFreeDatum_In: TransactionDatum = {
                        address: validatorAddress,
                        datumType: FreeEntity.className(),
                        datumObj: free_SmartUTxO.datumObj,
                    };
                    //--------------------------------------
                    const transactionFreeDatum_Out: TransactionDatum = {
                        address: validatorAddress,
                        datumType: FreeEntity.className(),
                        datumObj: freeDatum_Out,
                    };
                    //--------------------------------------
                    await TransactionBackEndApplied.setPendingTransaction(transaction, {
                        hash: txHash,
                        ids: {},
                        redeemers: {
                            freeValidatorRedeemerDatumUpdate: transactionFreeValidatorRedeemerDatumUpdate,
                        },
                        datums: { freeDatum_In: transactionFreeDatum_In, freeDatum_Out: transactionFreeDatum_Out },
                    });
                    //--------------------------------------
                    console_log(-1, this._Entity.className(), `Update Tx - txHash: ${txHash} - txCborHex: ${showData(txCborHex)}`);
                    return res.status(200).json({ txHash, txCborHex });
                    //--------------------------------------
                } catch (error) {
                    //--------------------------------------
                    // NOTE: si existe la transaccion, la elimino
                    // con esto libero los utxos
                    if (transaction !== undefined) {
                        await TransactionBackEndApplied.delete(transaction);
                    }
                    //--------------------------------------
                    throw error;
                }
            } catch (error) {
                console_error(-1, this._Entity.className(), `Update Tx - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while creating the ${this._Entity.apiRoute()} Update Tx: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `Update Tx - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // #endregion custom api handlers
}
