import { LucidEvolution, SignedMessage } from '@lucid-evolution/lucid';
import { OracleExternalToken, Token, Token_With_Price_And_Date, Token_With_Price_And_Date_And_Signature, type CS, type TN } from '../Commons/types.js';
import { checkIfIsOracleExtenalToken, isTokenADA, isToken_CS_And_TN_Valid, signMessage, verifyMessage } from '../Commons/helpers.js';
import { console_error, console_log } from '../Commons/BackEnd/globalLogs.js';
import { getGlobalLucid } from '../Commons/BackEnd/globalLucid.js';
import { globalSettings } from '../Commons/BackEnd/globalSettings.js';
import {
    JOB_MAX_TIME_WAITING_TO_COMPLETE_MS,
    JOB_TIME_WAITING_TO_TRY_AGAIN_MS,
    LUCID_NETWORK_MAINNET_ID,
    MAX_PRICE_AGE_FOR_USE_MS,
    MIN_AGE_BEFORE_REFRESH_MS,
    PRICEx1e6,
    TOKEN_ADA_TICKER,
    isMainnet,
    isTestnet,
    useOraclePrices,
} from '../Commons/Constants/constants.js';
import { BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import { formatHash } from '../Commons/formatters.js';
import { TOKENS_EXTERNAL_ORACLE } from '../Commons/TOKENS_EXTERNAL.js'
import { calculateBackoffDelay, createQueryURLString, hexToStr, isEmptyObject, isFrontEndEnvironment, showData, sleep, toJson } from '../Commons/utils.js';
import { JobEntity } from '../Entities/Job.Entity.js';
import { PriceEntity } from '../Entities/Price.Entity.js';
import { TimeBackEnd } from '../lib/Time/backEnd.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';
import { JobBackEndApplied } from './Job.BackEnd.All.js';
import { fetchWrapperBackEnd } from '../lib/FetchWrapper/FetchWrapper.BackEnd.js';

@BackEndAppliedFor(PriceEntity)
export class PriceBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = PriceEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    protected static async get_Actual_PriceDB_Of_Token(CS: CS, TN_Hex: TN, now?: number, validityMS?: number) {
        //--------------------------------------
        const pricesDB: PriceEntity[] = await this.get_Actual_PricesDB_Of_Tokens([{ CS, TN_Hex }], now, validityMS);
        //--------------------------------------
        const priceDB: PriceEntity | undefined = pricesDB.find((priceDB_) => priceDB_.CS === CS && priceDB_.TN_Hex === TN_Hex);
        //--------------------------------------
        return priceDB;
        //--------------------------------------
    }

    protected static async get_Actual_PricesDB_Of_Tokens(tokens: { CS: CS; TN_Hex: TN }[], now?: number, validityMS?: number): Promise<PriceEntity[]> {
        //----------------------------
        if (tokens.length === 0 || tokens.some((token) => token.CS === undefined || token.TN_Hex === undefined)) {
            throw `CS or TN_Hex not defined`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `get_Actual_PricesDB_Of_Tokens - Init - tokens: ${tokens.map((token) => `${formatHash(token.CS)}, ${hexToStr(token.TN_Hex)}`)}`);
        //----------------------------
        // standarize ADA and remove duplicates in tokens list
        // tokens = tokens.map((token) => {
        //     if (isTokenADA(token.CS, token.TN_Hex)) {
        //         return { ...token, CS: '', TN_Hex: '' };
        //     }
        //     return token;
        // });
        tokens = tokens.filter((token, index) => tokens.findIndex((token_) => token_.CS === token.CS && token_.TN_Hex === token.TN_Hex) === index);
        //----------------------------
        const currentTime = now !== undefined ? now : await TimeBackEnd.getServerTime();
        //--------------------------------------
        validityMS = validityMS ?? MAX_PRICE_AGE_FOR_USE_MS;
        //--------------------------------------
        const cutoffTime = currentTime - validityMS;
        //--------------------------------------
        console_log(
            0,
            this._Entity.className(),
            `get_Actual_PricesDB_Of_Tokens - Init - currentTime ${currentTime} - currentTime min: ${currentTime / (1000 * 60)} - validity min: ${
                validityMS / (1000 * 60)
            } - cutoffTime min: ${cutoffTime / (1000 * 60)}`
        );
        //--------------------------------------
        // create condition joining with or all the tokens im searching for
        const conditions = tokens.map((token) => ({ CS: token.CS, TN_Hex: token.TN_Hex }));
        // concatenate for mongoose with $or
        const queryCondition = { $or: conditions };
        //----------------------------
        // Building the aggregation pipeline
        const pipeline = [
            // Filter the documents
            { $match: { $and: [queryCondition, { date: { $gte: new Date(cutoffTime) } }] } },
            // Sort documents by date in descending order (latest first)
            { $sort: { date: -1 } },
            // Group by token identifiers and get the first document from each group
            {
                $group: {
                    _id: { CS: '$CS', TN_Hex: '$TN_Hex' },
                    latestPrice: { $first: '$$ROOT' }, // $$ROOT refers to the entire document
                },
            },
            // Optionally project fields (if you want to reshape the output)
            {
                $project: {
                    _id: 0, // Hide _id field
                    CS: '$latestPrice.CS',
                    TN_Hex: '$latestPrice.TN_Hex',
                    date: '$latestPrice.date',
                    priceADAx1e6: '$latestPrice.priceADAx1e6',
                    signature: '$latestPrice.signature',
                },
            },
        ];
        //----------------------------
        const pricesDB: PriceEntity[] = await this.aggregate_(pipeline);
        //----------------------------
        console_log(-1, this._Entity.className(), `get_Actual_PricesDB_Of_Tokens - len: ${pricesDB.length} - pricesDB: ${pricesDB.map((priceDB) => priceDB.show())} - OK`);
        //----------------------------
        return pricesDB;
    }

    public static async get_LastPriceDB_Of_Token(CS: CS, TN_Hex: TN): Promise<PriceEntity | undefined> {
        //--------------------------------------
        const pricesDB: PriceEntity[] = await this.get_LastPricesDB_Of_Tokens([{ CS, TN_Hex }]);
        //--------------------------------------
        const priceDB: PriceEntity | undefined = pricesDB.find((priceDB_) => priceDB_.CS === CS && priceDB_.TN_Hex === TN_Hex);
        //--------------------------------------
        return priceDB;
        //--------------------------------------
    }

    public static async get_LastPricesDB_Of_Tokens(tokens: { CS: CS; TN_Hex: TN }[]): Promise<PriceEntity[]> {
        //----------------------------
        if (tokens.length === 0 || tokens.some((token) => token.CS === undefined || token.TN_Hex === undefined)) {
            throw `CS or TN_Hex not defined`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `get_LastPricesDB_Of_Tokens - Init - tokens: ${tokens.map((token) => `${formatHash(token.CS)}, ${hexToStr(token.TN_Hex)}`)}`);
        //----------------------------
        // standarize ADA and remove duplicates in tokens list
        // tokens = tokens.map((token) => {
        //     if (isTokenADA(token.CS, token.TN_Hex)) {
        //         return { ...token, CS: '', TN_Hex: '' };
        //     }
        //     return token;
        // });
        tokens = tokens.filter((token, index) => tokens.findIndex((token_) => token_.CS === token.CS && token_.TN_Hex === token.TN_Hex) === index);
        //----------------------------
        // create condition joining with or all the tokens im searching for
        const conditions = tokens.map((token) => ({ CS: token.CS, TN_Hex: token.TN_Hex }));
        // concatenate for mongoose with $or
        const queryCondition = { $or: conditions };
        //----------------------------
        // Building the aggregation pipeline
        const pipeline = [
            // Filter the documents
            { $match: queryCondition },
            // Sort documents by date in descending order (latest first)
            { $sort: { date: -1 } },
            // Group by token identifiers and get the first document from each group
            {
                $group: {
                    _id: { CS: '$CS', TN_Hex: '$TN_Hex' },
                    latestPrice: { $first: '$$ROOT' }, // $$ROOT refers to the entire document
                },
            },
            // Optionally project fields (if you want to reshape the output)
            {
                $project: {
                    _id: 0, // Hide _id field
                    CS: '$latestPrice.CS',
                    TN_Hex: '$latestPrice.TN_Hex',
                    date: '$latestPrice.date',
                    priceADAx1e6: '$latestPrice.priceADAx1e6',
                    signature: '$latestPrice.signature',
                },
            },
        ];
        //----------------------------
        const pricesDB: PriceEntity[] = await this.aggregate_(pipeline);
        //----------------------------
        console_log(
            -1,
            this._Entity.className(),
            `get_LastPricesDB_Of_Tokens - len: ${pricesDB.length} - pricesDB: ${pricesDB.map(
                (priceDB) => `${formatHash(priceDB.CS)}, ${hexToStr(priceDB.TN_Hex)}: ${priceDB.priceADAx1e6}`
            )} - OK`
        );
        //----------------------------
        return pricesDB;
    }

    protected static async createNewPriceDBAndReturnToken(
        lucid: LucidEvolution,
        CS: CS,
        TN_Hex: TN,
        priceADAx1e6: bigint,
        date?: bigint | undefined
    ): Promise<Token_With_Price_And_Date_And_Signature> {
        return await JobBackEndApplied.executeWithJobLock(
            `createNewPriceDBAndReturnToken-${CS}-${TN_Hex}`,
            async () => {
                return this.createNewPriceDBAndReturnToken_(lucid, CS, TN_Hex, priceADAx1e6, date);
            },
            {
                description: `Creating new PriceDB and returning Token - Token: ${formatHash(CS)}, ${hexToStr(TN_Hex)}`,
                swLog: true,
            }
        );
    }

    protected static async createNewPriceDBAndReturnToken_(
        lucid: LucidEvolution,
        CS: CS,
        TN_Hex: TN,
        priceADAx1e6: bigint,
        date?: bigint | undefined
    ): Promise<Token_With_Price_And_Date_And_Signature> {
        //--------------------------------------
        if (date === undefined) {
            const serverTime = await TimeBackEnd.getServerTime();
            date = BigInt(serverTime);
        }
        //--------------------------------------
        const newToken: Token_With_Price_And_Date = { CS, TN_Hex, priceADAx1e6, date };
        //----------------------------
        const dataStr = toJson(newToken);
        //----------------------------
        const signature = await signMessage(lucid, process.env.ORACLE_WALLET_PRIVATEKEY_CBORHEX!, dataStr);
        //--------------------------------------
        let priceDB = new PriceEntity();
        //----------------------------
        priceDB.CS = newToken.CS;
        priceDB.TN_Hex = newToken.TN_Hex;
        priceDB.TN_Str = hexToStr(newToken.TN_Hex);
        priceDB.priceADAx1e6 = newToken.priceADAx1e6!;
        priceDB.date = new Date(Number(newToken.date));
        priceDB.signature = signature;
        //----------------------------
        try {
            //----------------------------
            // lo hago en try por que si se ejecuta por otro usuario al mismo tiempo y ese lo elimina, aca arroja error
            //----------------------------
            priceDB = await this.create(priceDB);
            //----------------------------
            console_log(0, this._Entity.className(), `delete_Old_PriceDB - ${formatHash(CS)}, ${hexToStr(TN_Hex)}`);
            //----------------------------
            await this.deleteByParams_({ CS, TN_Hex, _id: { $ne: priceDB._DB_id } });
            //----------------------------
        } catch (error) {}
        //----------------------------
        const token: Token_With_Price_And_Date_And_Signature = { ...newToken, date, signature };
        //----------------------------
        return token;
    }

    protected static async verifyOraclePriceAndCreateNewPriceDBAndReturnToken(
        lucid: LucidEvolution,
        CS: CS,
        TN_Hex: TN,
        oracleData: any
    ): Promise<Token_With_Price_And_Date_And_Signature> {
        //--------------------------------------
        const dataPrice = oracleData.data;
        // console.log(`data = ${JSON.stringify(dataPrices)}\n`);
        //--------------------------------------
        const serverTime = await TimeBackEnd.getServerTime(true, true);
        //--------------------------------------
        const currentTimeMs = serverTime;
        //--------------------------------------
        let tokenTime;
        //TODO: revisar esto en mainnet, la idea es que en mainnet se use el timestamp del token como viene del oraculo
        if (isMainnet) {
            tokenTime = BigInt(Number(dataPrice.execution_time) * 1000);
        } else {
            tokenTime = BigInt(serverTime);
        }
        //--------------------------------------
        const expiryTimeMs = tokenTime + BigInt(MAX_PRICE_AGE_FOR_USE_MS);
        if (BigInt(currentTimeMs) > expiryTimeMs) {
            throw `Token ${CS + ' ' + TN_Hex} has expired`;
        }
        //----------------------------
        let dataStr = JSON.stringify(dataPrice);
        //-------------------------
        const signature: SignedMessage = {
            key: oracleData.sig_msg.key,
            signature: oracleData.sig_msg.signature,
        };
        //-------------------------
        const oracleInternalPublicKeyCborHex = globalSettings.siteSettings!.oracle_internal_wallet_publickey_cborhex;
        //-------------------------
        if (verifyMessage(lucid, oracleInternalPublicKeyCborHex, dataStr, signature, LUCID_NETWORK_MAINNET_ID)) {
            //----------------------------
            const priceADAx1e6 = BigInt(Math.round(Number(dataPrice.price * PRICEx1e6)));
            //----------------------------
            // NOTE: esto va a volver a generar una nueva firma, diferente a la que vino del oraculo
            // es por que el precio se calcula nuevamente aqui y por que la fecha es la del servidor en todos los casos que no son mainnet
            const token: Token_With_Price_And_Date_And_Signature = await this.createNewPriceDBAndReturnToken(lucid, CS, TN_Hex, priceADAx1e6, tokenTime);
            //----------------------------
            return token;
            //-------------------------
        } else {
            //-------------------------
            console_log(
                0,
                this._Entity.className(),
                `verifyOraclePriceAndCreateNewPriceDBAndReturnToken - Token ${oracleData.policyID + ' ' + oracleData.name} has invalid signature`
            );
            //-------------------------
            throw `Token ${oracleData.policyID + ' ' + oracleData.name} has invalid signature`;
            //-------------------------
        }
    }

    protected static async verifyExternalOraclePriceAndCreateNewPriceDBAndReturnToken(
        lucid: LucidEvolution,
        info: OracleExternalToken,
        token: Token_With_Price_And_Date_And_Signature
    ): Promise<Token_With_Price_And_Date_And_Signature> {
        //--------------------------------------
        if (token.priceADAx1e6 === undefined || token.date === undefined || token.signature === undefined) {
            throw `Token token has undefined values`;
        }
        //--------------------------------------
        const serverTime = await TimeBackEnd.getServerTime(true, true);
        //--------------------------------------
        const currentTimeMs = serverTime;
        //--------------------------------------
        let tokenTime;
        //TODO: revisar esto en mainnet, la idea es que en mainnet se use el timestamp del token como viene del oraculo
        if (isMainnet) {
            tokenTime = BigInt(token.date);
        } else {
            tokenTime = BigInt(serverTime);
        }
        //--------------------------------------
        const expiryTimeMs = tokenTime + BigInt(MAX_PRICE_AGE_FOR_USE_MS);
        if (BigInt(currentTimeMs) > expiryTimeMs) {
            throw `Token ${token.CS + ' ' + token.TN_Hex} has expired`;
        }
        //----------------------------
        const newToken: Token_With_Price_And_Date = { CS: token.CS, TN_Hex: token.TN_Hex, priceADAx1e6: token.priceADAx1e6, date: token.date };
        //----------------------------
        let dataStr = toJson(newToken);
        //----------------------------
        const oracleExternalPublicKeyCborHex = info.PublicKeyCborHex;
        //--------------------------------------
        if (verifyMessage(lucid, oracleExternalPublicKeyCborHex, dataStr, token.signature)) {
            //----------------------------
            // NOTE: esto va a volver a generar una nueva firma, diferente a la que vino del oraculo externo
            // es por que el precio se calcula nuevamente aqui y por que la fecha es la del servidor en todos los casos que no son mainnet
            const newToken: Token_With_Price_And_Date_And_Signature = await this.createNewPriceDBAndReturnToken(lucid, token.CS, token.TN_Hex, token.priceADAx1e6, tokenTime);
            //----------------------------
            return newToken;
            //-------------------------
        } else {
            //-------------------------
            console_log(
                0,
                this._Entity.className(),
                `verifyExternalOraclePriceAndCreateNewPriceDBAndReturnToken - Token ${token.CS + ' ' + hexToStr(token.TN_Hex)} has invalid signature`
            );
            //-------------------------
            throw `Token ${token.CS + ' ' + hexToStr(token.TN_Hex)} has invalid signature`;
            //-------------------------
        }
    }

    protected static async create_Mock_NewPriceDB_BasedIn_LastOne(lastPriceDB: PriceEntity) {
        //----------------------------
        console_log(
            0,
            this._Entity.className(),
            `create_Mock_NewPriceDB_BasedIn_LastOne - ${formatHash(lastPriceDB.CS)}, ${hexToStr(lastPriceDB.TN_Hex)} - Mocking existing Price`
        );
        //----------------------------
        const lucid = await getGlobalLucid();
        //----------------------------
        // voy a generar un nuevo precio de forma aleatoria en funcion del ultimo tiempo que habia
        //----------------------------
        let priceADAx1e6 = lastPriceDB.priceADAx1e6;
        //----------------------------
        const randomChoice = Math.floor(Math.random() * 30);
        // Define percentage changes: +/- 10%, +/- 5%, etc.
        const percentageChanges = [-1, 1, -2, 2, +1, +2]; // Percentages
        const selectedPercentage = randomChoice > percentageChanges.length ? 0 : percentageChanges[randomChoice % percentageChanges.length];
        const percentageFactor = selectedPercentage / 100;
        // Apply the percentage change
        priceADAx1e6 += BigInt(Math.round(Number(priceADAx1e6) * percentageFactor));
        // Ensure price doesn't fall below a certain threshold
        priceADAx1e6 = priceADAx1e6 < 0n ? 0n : priceADAx1e6;
        //----------------------------
        const token: Token_With_Price_And_Date_And_Signature = await this.createNewPriceDBAndReturnToken(lucid, lastPriceDB.CS, lastPriceDB.TN_Hex, priceADAx1e6);
        //----------------------------
        return token;
    }

    protected static async create_Mock_NewPriceDB(CS: string, TN_Hex: string) {
        //----------------------------
        console_log(0, this._Entity.className(), `create_Mock_NewPriceDB - ${formatHash(CS)}, ${hexToStr(TN_Hex)}`);
        //----------------------------
        const lucid = await getGlobalLucid();
        //----------------------------
        // creo un precio falso
        const priceADAx1e6 = 10000000n;
        //----------------------------
        const token: Token_With_Price_And_Date_And_Signature = await this.createNewPriceDBAndReturnToken(lucid, CS, TN_Hex, priceADAx1e6);
        //----------------------------
        return token;
    }

    public static async get_Token_With_Price_And_Signature(
        CS: CS,
        TN_Hex: TN,
        forceRefresh: boolean = false,
        validityMS?: number,
        forceUseOracle: boolean = false
    ): Promise<Token_With_Price_And_Date_And_Signature | undefined> {
        //--------------------------------------
        const tokens: Token_With_Price_And_Date_And_Signature[] = await this.get_Tokens_With_Price_And_SignatureWrapper([{ CS, TN_Hex }], forceRefresh, validityMS, forceUseOracle);
        //--------------------------------------
        const token: Token_With_Price_And_Date_And_Signature | undefined = tokens.find((token_) => token_.CS === CS && token_.TN_Hex === TN_Hex);
        //--------------------------------------
        return token;
        //--------------------------------------
    }

    public static async get_Tokens_With_Price_And_SignatureWrapper(
        tokens: { CS: CS; TN_Hex: TN }[],
        forceRefresh: boolean = false,
        validityMS?: number,
        forceUseOracle: boolean = false
    ): Promise<Token_With_Price_And_Date_And_Signature[]> {
        //----------------------------
        if (tokens.length === 0 || tokens.some((token) => token.CS === undefined || token.TN_Hex === undefined)) {
            throw `CS or TN_Hex not defined`;
        }
        //----------------------------
        if (!tokens.every((token) => isToken_CS_And_TN_Valid(token.CS, token.TN_Hex))) {
            throw `CS or TN_Hex not valid`;
        }
        //----------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        try {
            //----------------------------
            console_log(
                1,
                this._Entity.className(),
                `get_Tokens_With_Price_And_SignatureWrapper - Init - tokens: ${tokens
                    .map((token) => `${hexToStr(token.TN_Hex)}`)
                    .join(', ')} - forceRefresh: ${forceRefresh} - forceUseOracle: ${forceUseOracle}`
            );
            //----------------------------
            // standarize ADA and remove duplicates in tokens list
            // tokens = tokens.map((token) => {
            //     if (isTokenADA(token.CS, token.TN_Hex)) {
            //         return { ...token, CS: '', TN_Hex: '' };
            //     }
            //     return token;
            // });
            tokens = tokens.filter((token, index) => tokens.findIndex((token_) => token_.CS === token.CS && token_.TN_Hex === token.TN_Hex) === index);
            //----------------------------
            const tokensThatAreADA = tokens.filter((token) => isTokenADA(token.CS, token.TN_Hex));
            const tokensThatAreNotADA = tokens.filter((token) => !isTokenADA(token.CS, token.TN_Hex));
            //--------------------------------------
            const tokenThatAreADAWithPrice: Token_With_Price_And_Date_And_Signature = { CS: '', TN_Hex: '', priceADAx1e6: 1_000_000n, date: undefined, signature: undefined };
            //--------------------------------------
            if (tokensThatAreADA.length > 0 && tokensThatAreNotADA.length === 0) {
                console_log(-1, this._Entity.className(), `get_Tokens_With_Price_And_SignatureWrapper - All tokens were ${TOKEN_ADA_TICKER} - Processed all tokens successfully.`);
                return [tokenThatAreADAWithPrice];
            }
            //--------------------------------------
            let retries = 0;
            const startTime = Date.now();
            const maxWaitTimeMs = JOB_MAX_TIME_WAITING_TO_COMPLETE_MS;
            const retryDelayMs = JOB_TIME_WAITING_TO_TRY_AGAIN_MS;
            //----------------------------
            const tokenRegexArray = tokens.filter((token) => !isTokenADA(token.CS, token.TN_Hex)).map((token) => ({ name: `/getTokensPrice-.*${token.CS}${token.TN_Hex}.*/i` }));
            //----------------------------
            while (Date.now() - startTime < maxWaitTimeMs) {
                //----------------------------
                // este loop va a intentar obtener los precios desde la bd para evitar fetch al oraculo en simultaneo
                // va a iterar mientras exista algun job de alguno de estos tokens
                // en cada iteracion va a leer la db de nuevo, cosa que si el oraculo ya devolvio los precios, los tome desde ahi
                // si no estan en la db o si no hay job, va a salir del loop y crear el job
                //----------------------------
                let tokensWithPrices: Token_With_Price_And_Date_And_Signature[] = [];
                //----------------------------
                if (forceRefresh === false) {
                    //----------------------------
                    const serverTime = await TimeBackEnd.getServerTime();
                    //----------------------------
                    const pricesDB: PriceEntity[] = await this.get_Actual_PricesDB_Of_Tokens(tokensThatAreNotADA, serverTime, validityMS);
                    //----------------------------
                    tokensWithPrices = pricesDB.map((priceDB) => ({
                        CS: priceDB.CS,
                        TN_Hex: priceDB.TN_Hex,
                        priceADAx1e6: priceDB.priceADAx1e6,
                        date: BigInt(priceDB.date.getTime()),
                        signature: priceDB.signature,
                    }));
                    //----------------------------
                    console_log(
                        0,
                        this._Entity.className(),
                        `get_Tokens_With_Price_And_SignatureWrapper - PricesDB Found: ${tokensWithPrices
                            .map((token) => `${hexToStr(token.TN_Hex)}: ${token.priceADAx1e6}`)
                            .join(', ')}`
                    );
                    //----------------------------
                } else if (useOraclePrices === true || forceUseOracle === true) {
                    //----------------------------
                    // esto es medida de seguridad para prevenir abuso del oraculo
                    // ahora si se fuerza el refresh, se va a usar el oraculo solo si no se encuentra un precio con un minimo tiempo de validez
                    //----------------------------
                    const serverTime = await TimeBackEnd.getServerTime();
                    //----------------------------
                    let pricesDB: PriceEntity[] = await this.get_Actual_PricesDB_Of_Tokens(tokensThatAreNotADA, serverTime, MIN_AGE_BEFORE_REFRESH_MS);
                    //----------------------------
                    tokensWithPrices = pricesDB.map((priceDB) => ({
                        CS: priceDB.CS,
                        TN_Hex: priceDB.TN_Hex,
                        priceADAx1e6: priceDB.priceADAx1e6,
                        date: BigInt(priceDB.date.getTime()),
                        signature: priceDB.signature,
                    }));
                    //----------------------------
                    console_log(
                        0,
                        this._Entity.className(),
                        `get_Tokens_With_Price_And_SignatureWrapper - Trying to avoid fetch from Oracle - PricesDB Found: ${tokensWithPrices
                            .map((token) => `${hexToStr(token.TN_Hex)}: ${token.priceADAx1e6}`)
                            .join(', ')}`
                    );
                    //----------------------------
                }
                //--------------------------------------
                // Get tokens that are not found in pricesDB or require a force refresh
                const tokensToFetchFromOracle = tokensThatAreNotADA.filter(
                    (token) => !tokensWithPrices.some((tokenWithPrice) => tokenWithPrice.CS === token.CS && tokenWithPrice.TN_Hex === token.TN_Hex)
                );
                //--------------------------------------
                if (tokensToFetchFromOracle.length === 0) {
                    console_log(0, this._Entity.className(), `get_Tokens_With_Price_And_SignatureWrapper - Found all tokens in DB`);
                    tokensThatAreADA.length === 0 ? tokensWithPrices : [tokenThatAreADAWithPrice, ...tokensWithPrices];
                } else {
                    console_log(
                        0,
                        this._Entity.className(),
                        `get_Tokens_With_Price_And_SignatureWrapper - Missing Tokens len - ${tokensToFetchFromOracle.length} - Not found all tokens in DB, will try with Job...`
                    );
                }
                //----------------------------
                let josb: JobEntity[] = await this.getByParams_({
                    $and: [{ $or: tokenRegexArray }, { $or: [{ status: 'running' }, { status: 'pending' }] }],
                });
                //----------------------------
                console_log(
                    0,
                    this._Entity.className(),
                    `get_Tokens_With_Price_And_SignatureWrapper - Checking if Job exist - Jobs len - ${josb.length} - tokenRegexArray: ${toJson(tokenRegexArray)}`
                );
                //----------------------------
                if (josb.length > 0) {
                    retries++;
                    // Add exponential backoff with jitter
                    const backoffDelay = calculateBackoffDelay(retryDelayMs, retries);
                    console_log(
                        0,
                        this._Entity.className(),
                        `get_Tokens_With_Price_And_SignatureWrapper - There are existings jobs - retryDelayMs: ${retryDelayMs} - retries: ${retries} - Waiting ${backoffDelay} ms before retrying...`
                    );
                    await sleep(backoffDelay);
                } else {
                    break;
                }
            }
            //----------------------------
            console_log(0, this._Entity.className(), `get_Tokens_With_Price_And_SignatureWrapper - Creating new Job...`);
            //----------------------------
            const tokensStr = tokens
                .filter((token) => !isTokenADA(token.CS, token.TN_Hex))
                .map((token) => `${token.CS}${token.TN_Hex}`)
                .join('-');
            const jobId = `getTokensPrice-${tokensStr}`;
            //----------------------------
            return await JobBackEndApplied.executeWithJobLock(
                jobId,
                async () => {
                    return this.get_Tokens_With_Price_And_Signature_(tokens, forceRefresh, validityMS, forceUseOracle);
                },
                {
                    description: `Fetching creating and updating prices for tokens: ${tokensStr}`,
                    swLog: true,
                }
            );
        } finally {
            console_log(-1, this._Entity.className(), `get_Tokens_With_Price_And_SignatureWrapper - End`);
        }
    }

    public static async get_Tokens_With_Price_And_Signature_(
        tokens: { CS: CS; TN_Hex: TN }[],
        forceRefresh: boolean = false,
        validityMS?: number,
        forceUseOracle: boolean = false
    ): Promise<Token_With_Price_And_Date_And_Signature[]> {
        //----------------------------
        if (tokens.length === 0 || tokens.some((token) => token.CS === undefined || token.TN_Hex === undefined)) {
            throw `CS or TN_Hex not defined`;
        }
        //----------------------------
        if (!tokens.every((token) => isToken_CS_And_TN_Valid(token.CS, token.TN_Hex))) {
            throw `CS or TN_Hex not valid`;
        }
        //----------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        console_log(
            1,
            this._Entity.className(),
            `get_Tokens_With_Price_And_Signature - Init - tokens: ${tokens
                .map((token) => `${hexToStr(token.TN_Hex)}`)
                .join(', ')} - forceRefresh: ${forceRefresh} - forceUseOracle: ${forceUseOracle}`
        );
        //----------------------------
        // standarize ADA and remove duplicates in tokens list
        // tokens = tokens.map((token) => {
        //     if (isTokenADA(token.CS, token.TN_Hex)) {
        //         return { ...token, CS: '', TN_Hex: '' };
        //     }
        //     return token;
        // });
        tokens = tokens.filter((token, index) => tokens.findIndex((token_) => token_.CS === token.CS && token_.TN_Hex === token.TN_Hex) === index);
        //----------------------------
        const tokensThatAreADA = tokens.filter((token) => isTokenADA(token.CS, token.TN_Hex));
        const tokensThatAreNotADA = tokens.filter((token) => !isTokenADA(token.CS, token.TN_Hex));
        //--------------------------------------
        const tokenThatAreADAWithPrice: Token_With_Price_And_Date_And_Signature = { CS: '', TN_Hex: '', priceADAx1e6: 1_000_000n, date: undefined, signature: undefined };
        //--------------------------------------
        if (tokensThatAreADA.length > 0 && tokensThatAreNotADA.length === 0) {
            console_log(-1, this._Entity.className(), `get_Tokens_With_Price_And_Signature - All tokens were ${TOKEN_ADA_TICKER} - Processed all tokens successfully.`);
            return [tokenThatAreADAWithPrice];
        }
        //--------------------------------------
        let tokensWithPrices: Token_With_Price_And_Date_And_Signature[] = [];
        //--------------------------------------
        if (forceRefresh === false) {
            //----------------------------
            const serverTime = await TimeBackEnd.getServerTime();
            //----------------------------
            let pricesDB: PriceEntity[] = await this.get_Actual_PricesDB_Of_Tokens(tokensThatAreNotADA, serverTime, validityMS);
            //----------------------------
            tokensWithPrices = pricesDB.map((priceDB) => ({
                CS: priceDB.CS,
                TN_Hex: priceDB.TN_Hex,
                priceADAx1e6: priceDB.priceADAx1e6,
                date: BigInt(priceDB.date.getTime()),
                signature: priceDB.signature,
            }));
            //----------------------------
            console_log(
                0,
                this._Entity.className(),
                `get_Tokens_With_Price_And_Signature - PricesDB Found: ${tokensWithPrices.map((token) => `${hexToStr(token.TN_Hex)}: ${token.priceADAx1e6}`).join(', ')}`
            );
            //----------------------------
        } else if (useOraclePrices === true || forceUseOracle === true) {
            //----------------------------
            // esto es medida de seguridad para prevenir abuso del oraculo
            // ahora si se fuerza el refresh, se va a usar el oraculo solo si no se encuentra un precio con un minimo tiempo de validez
            //----------------------------
            const serverTime = await TimeBackEnd.getServerTime();
            //----------------------------
            let pricesDB: PriceEntity[] = await this.get_Actual_PricesDB_Of_Tokens(tokensThatAreNotADA, serverTime, MIN_AGE_BEFORE_REFRESH_MS);
            //----------------------------
            tokensWithPrices = pricesDB.map((priceDB) => ({
                CS: priceDB.CS,
                TN_Hex: priceDB.TN_Hex,
                priceADAx1e6: priceDB.priceADAx1e6,
                date: BigInt(priceDB.date.getTime()),
                signature: priceDB.signature,
            }));
            //----------------------------
            console_log(
                0,
                this._Entity.className(),
                `get_Tokens_With_Price_And_Signature - Trying to avoid fetch from Oracle - PricesDB Found: ${tokensWithPrices
                    .map((token) => `${hexToStr(token.TN_Hex)}: ${token.priceADAx1e6}`)
                    .join(', ')}`
            );
            //----------------------------
        }
        //--------------------------------------
        // Get tokens that are not found in pricesDB or require a force refresh
        const tokensToFetchFromOracles = tokensThatAreNotADA.filter(
            (token) => !tokensWithPrices.some((tokenWithPrice) => tokenWithPrice.CS === token.CS && tokenWithPrice.TN_Hex === token.TN_Hex)
        );
        //--------------------------------------
        let tokensToFetchFromExternalOracle: Token[] = [];
        let tokensToFetchFromInternalOracle: Token[] = [];
        // Separar tokens External, solo si esta useOracle true
        if (useOraclePrices === true || forceUseOracle === true) {
            // solo voy a buscar precios de tokens LP si estoy en mainnet o testnet y estoy usando oraculo
            // en cualquier otro caso, tokens LP van a ser considerados tokens normales y se va a mockear el precio
            // esto evita que se llame a las apis de calculo de LP que necesitan conectarse con blockfrost mainnet, etc
            tokensToFetchFromExternalOracle = tokensToFetchFromOracles.filter((token) => checkIfIsOracleExtenalToken(token.CS, token.TN_Hex));
            tokensToFetchFromInternalOracle = tokensToFetchFromOracles.filter((token) => !checkIfIsOracleExtenalToken(token.CS, token.TN_Hex));
        }
        //--------------------------------------
        if (tokensToFetchFromExternalOracle.length > 0 && (forceUseOracle || useOraclePrices)) {
            //--------------------------------------
            console_log(
                0,
                this._Entity.className(),
                `get_Tokens_With_Price_And_Signature - tokens External Oracle: ${tokensToFetchFromExternalOracle.map((token) => `${hexToStr(token.TN_Hex)}`).join(', ')}`
            );
            //--------------------------------------
            let externalOracleTokenPrices: Token_With_Price_And_Date_And_Signature[] = [];
            //--------------------------------------
            try {
                externalOracleTokenPrices = await this.get_Tokens_With_Price_And_Signature_From_ExternalOracle(tokensToFetchFromExternalOracle);
            } catch (error) {
                throw error;
            }
            //--------------------------------------
            tokensWithPrices = [...tokensWithPrices, ...externalOracleTokenPrices];
        }
        //--------------------------------------
        if (tokensToFetchFromInternalOracle.length > 0 && (forceUseOracle || useOraclePrices)) {
            //--------------------------------------
            console_log(
                0,
                this._Entity.className(),
                `get_Tokens_With_Price_And_Signature - tokens Internal Oracle: ${tokensToFetchFromInternalOracle.map((token) => `${hexToStr(token.TN_Hex)}`).join(', ')}`
            );
            //--------------------------------------
            let oracleTokenPrices: Token_With_Price_And_Date_And_Signature[] = [];
            //--------------------------------------
            try {
                oracleTokenPrices = await this.get_Tokens_With_Price_And_Signature_From_Oracle(tokensToFetchFromInternalOracle);
            } catch (error) {
                throw error;
            }
            //--------------------------------------
            tokensWithPrices = [...tokensWithPrices, ...oracleTokenPrices];
        }
        //--------------------------------------
        // Get missingTokens that are not found in pricesDB or could not be fetched from Oracle (because maybe the token does not exist in oracle)
        const missingTokens = tokensThatAreNotADA.filter(
            (token) => !tokensWithPrices.some((tokenWithPrice) => tokenWithPrice.CS === token.CS && tokenWithPrice.TN_Hex === token.TN_Hex)
        );
        //--------------------------------------
        if (missingTokens.length > 0) {
            //--------------------------------------
            const useOracleRules = (useOraclePrices === true || forceUseOracle === true) && (isTestnet === true || isMainnet === true);
            //--------------------------------------
            if (useOracleRules) {
                //--------------------------------------
                console_error(
                    0,
                    this._Entity.className(),
                    `get_Tokens_With_Price_And_Signature - Token not found in PriceDB nor Oracle: ${missingTokens.map((token) => `${hexToStr(token.TN_Hex)}`).join(', ')}`
                );
                //--------------------------------------
                // throw `Token not found in PriceDB nor Oracle: ${missingTokens.map((token) => `${hexToStr(token.TN_Hex)}`).join(', ')}`;
                //--------------------------------------
            } else {
                //--------------------------------------
                // si el token no se encontro en la base de datos, y si no usaba oraculo, o si uso pero estoy en testnet, entonces mockeo el precio
                //--------------------------------------
                console_log(
                    0,
                    this._Entity.className(),
                    `get_Tokens_With_Price_And_Signature - Token not found in PriceDB nor Oracle: ${missingTokens
                        .map((token) => `${hexToStr(token.TN_Hex)}`)
                        .join(', ')}  - Mocking Prices...`
                );
                //--------------------------------------
                const lastPricesDB = await this.get_LastPricesDB_Of_Tokens(missingTokens);
                const missinglastPricesDB = missingTokens.filter(
                    (token) => !lastPricesDB.some((lastPriceDB) => lastPriceDB.CS === token.CS && lastPriceDB.TN_Hex === token.TN_Hex)
                );
                //--------------------------------------
                for (let lastPriceDB of lastPricesDB) {
                    //--------------------------------------
                    const token = await this.create_Mock_NewPriceDB_BasedIn_LastOne(lastPriceDB);
                    //--------------------------------------
                    tokensWithPrices.push(token);
                }
                //--------------------------------------
                for (let tokenMissingLastPrice of missinglastPricesDB) {
                    //--------------------------------------
                    const token = await this.create_Mock_NewPriceDB(tokenMissingLastPrice.CS, tokenMissingLastPrice.TN_Hex);
                    //--------------------------------------
                    tokensWithPrices.push(token);
                }
            }
        }
        //--------------------------------------
        if (missingTokens.length > 0) {
            // faltaron tokens. Si no usaba oraculo, o si estaba en testnet, entonces los tokens que faltaban los mockee
            console_log(-1, this._Entity.className(), `get_Tokens_With_Price_And_Signature - Processed all tokens with some mocked Prices.`);
        } else {
            console_log(-1, this._Entity.className(), `get_Tokens_With_Price_And_Signature - Processed all tokens successfully.`);
        }
        //--------------------------------------
        return tokensThatAreADA.length === 0 ? tokensWithPrices : [tokenThatAreADAWithPrice, ...tokensWithPrices];
    }

    public static async get_Tokens_With_Price_And_Signature_From_Oracle(tokens: { CS: CS; TN_Hex: TN }[]): Promise<Token_With_Price_And_Date_And_Signature[]> {
        //-------------------------
        console_log(
            1,
            this._Entity.className(),
            `get_Tokens_With_Price_And_Signature_From_Oracle - Init - tokens: ${tokens.map((token) => `${hexToStr(token.TN_Hex)}`).join(', ')}`
        );
        //-------------------------
        const lucid = await getGlobalLucid();
        //-------------------------
        let oracleDataPricesDict: Record<string, any> = {};
        //-------------------------
        const results: Token_With_Price_And_Date_And_Signature[] = [];
        //-------------------------
        try {
            //-------------------------
            oracleDataPricesDict = await this.get_Tokens_PriceData_From_OracleApi(tokens);
            //-------------------------
            for (const { CS, TN_Hex } of tokens) {
                //-------------------------
                const tokenKey = isTestnet ? `${TN_Hex}` : `${CS}${TN_Hex}`;
                //-------------------------
                const oracleData = oracleDataPricesDict[tokenKey];
                //-------------------------
                if (oracleData !== undefined && !isEmptyObject(oracleData.data)) {
                    //-------------------------
                    try {
                        //-------------------------
                        const token: Token_With_Price_And_Date_And_Signature = await this.verifyOraclePriceAndCreateNewPriceDBAndReturnToken(lucid, CS, TN_Hex, oracleData);
                        //-------------------------
                        console_log(
                            0,
                            this._Entity.className(),
                            `get_Token_With_Price_And_Signature_From_Oracle - Token ${oracleData.data.policyID + ' ' + oracleData.data.name} - Oracle OK - priceADAx1e06: ${
                                token.priceADAx1e6
                            }`
                        );
                        //-------------------------
                        results.push(token);
                        //-------------------------
                    } catch (error) {
                        //-------------------------
                        console_error(0, this._Entity.className(), `get_Tokens_With_Price_And_Signature_From_Oracle - Error: ${error}`);
                        // throw error
                        // NOTE: va a continuar sin tirar error y va a ser quien llama que va a decidir que hacer, si tira eroro o si crea mocking precio
                        //-------------------------
                    }
                } else {
                    //-------------------------
                    console_error(0, this._Entity.className(), `get_Tokens_With_Price_And_Signature - Oracle Data for Token ${CS + ' ' + hexToStr(TN_Hex)} was not retrieved`);
                    // throw `Oracle Data for Token ${CS + ' ' + hexToStr(TN_Hex)} was not retrieved`;
                    //  NOTE:va a continuar sin tirar error y va a ser quien llama que va a decidir que hacer, si tira eroro o si crea mocking precio
                    //-------------------------
                }
            }
            //-------------------------
            console_log(-1, this._Entity.className(), `get_Tokens_With_Price_And_Signature - All tokens processed - OK`);
            //-------------------------
            return results;
            //-------------------------
        } catch (error) {
            //-------------------------
            console_error(-1, this._Entity.className(), `get_Tokens_With_Price_And_Signature_From_Oracle - Error: ${error}`);
            //-------------------------
            throw error;
            //-------------------------
        }
    }

    public static async get_Tokens_PriceData_From_OracleApi(tokens: { CS: CS; TN_Hex: TN }[]): Promise<Record<string, any>> {
        //----------------------------
        // console.log("get_Tokens_PriceData_From_OracleApi: " + log(token))
        //------------------
        //TODO: manejar estas constantes en otro lado
        const count = 1;
        const difference = 0.25;
        const desviation = 0.15;
        //------------------
        const queryString = createQueryURLString({ count, difference, desviation });
        //------------------
        const body = toJson({
            tokens: tokens.map((token) => {
                if (isTestnet) {
                    return { encoded: token.TN_Hex };
                } else {
                    return { policyID: token.CS, encoded: token.TN_Hex };
                }
            }),
        });
        //----------------------------
        const rute = `/tokens/prices${queryString}`;
        //----------------------------
        const urlApi = process.env.ORACLE_PRICE_API + rute;
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        };
        try {
            //----------------------------
            // await sleep(2000); // HACK: para que no se llame tan seguido al oraculo
            //----------------------------
            const response = await fetchWrapperBackEnd(urlApi, requestOptions);
            //----------------------------
            switch (response.status) {
                case 200: {
                    const data = await response.json();
                    console_log(0, this._Entity.className(), `get_Tokens_PriceData_From_OracleApi - Data: ${showData(data)} - reponse OK`);
                    return data;
                }
                default: {
                    const errorData = await response.json();
                    //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                    throw `${errorData.error.message ? errorData.error.message : errorData.error} - url: ${urlApi}`;
                }
            }
            //----------------------------
        } catch (error) {
            console_error(0, this._Entity.className(), `get_Tokens_PriceData_From_OracleApi - Error: ${error} - url: ${urlApi}`);
            throw error;
        }
    }

    public static async get_Tokens_With_Price_And_Signature_From_ExternalOracle(
        tokens: Token[],
        forceRefresh: boolean = false,
        validityMS?: number,
        forceUseOracle: boolean = false
    ): Promise<Token_With_Price_And_Date_And_Signature[]> {
        //-------------------------
        try {
            console_log(
                1,
                this._Entity.className(),
                `get_Tokens_With_Price_And_Signature_From_ExternalOracle - Init - tokens: ${tokens.map((token) => `${hexToStr(token.TN_Hex)}`).join(', ')}`
            );
            //-------------------------
            const lucid = await getGlobalLucid();
            //-------------------------
            const tokensExternalOracleInfo = tokens.map((token) => {
                const infoToken = TOKENS_EXTERNAL_ORACLE.find((tokenExternal) => tokenExternal.CS === token.CS && tokenExternal.TN_Hex === token.TN_Hex);
                if (infoToken === undefined) {
                    throw `Token ${token.CS + ' ' + hexToStr(token.TN_Hex)} not found in External Oracle`;
                }
                return infoToken;
            });
            //-------------------------
            if (tokensExternalOracleInfo.length !== tokens.length) {
                throw `Some tokens are not in the External Oracle`;
            }
            //-------------------------
            const tokenPricesExternalOracleFetch: Token_With_Price_And_Date_And_Signature[] = await this.get_Tokens_PriceData_From_ExternalOracleApi(
                tokensExternalOracleInfo,
                forceRefresh,
                validityMS,
                forceUseOracle
            );
            //-------------------------
            const tokenPricesExternalOracleResult: Token_With_Price_And_Date_And_Signature[] = [];
            //-------------------------
            for (const { CS, TN_Hex } of tokens) {
                //-------------------------
                const tokenFetch: Token_With_Price_And_Date_And_Signature | undefined = tokenPricesExternalOracleFetch.find((token) => token.CS === CS && token.TN_Hex === TN_Hex);
                //-------------------------
                if (tokenFetch !== undefined) {
                    //-------------------------
                    try {
                        //-------------------------
                        const infoToken = TOKENS_EXTERNAL_ORACLE.find((tokenExternal) => tokenExternal.CS === CS && tokenExternal.TN_Hex === TN_Hex);
                        if (infoToken === undefined) {
                            throw `Token ${CS + ' ' + hexToStr(TN_Hex)} not found in External Oracle`;
                        }
                        const tokenResult: Token_With_Price_And_Date_And_Signature = await this.verifyExternalOraclePriceAndCreateNewPriceDBAndReturnToken(
                            lucid,
                            infoToken,
                            tokenFetch
                        );
                        //-------------------------
                        console_log(
                            0,
                            this._Entity.className(),
                            `get_Tokens_With_Price_And_Signature_From_ExternalOracle - Token ${tokenResult.CS + ' ' + hexToStr(tokenResult.TN_Hex)}  - Oracle OK - priceADAx1e06: ${
                                tokenResult.priceADAx1e6
                            }`
                        );
                        //-------------------------
                        tokenPricesExternalOracleResult.push(tokenResult);
                        //-------------------------
                    } catch (error) {
                        //-------------------------
                        console_error(0, this._Entity.className(), `get_Tokens_With_Price_And_Signature_From_ExternalOracle - Error: ${error}`);
                        // throw error
                        // NOTE: va a continuar sin tirar error y va a ser quien llama que va a decidir que hacer, si tira eroro o si crea mocking precio
                        //-------------------------
                    }
                } else {
                    //-------------------------
                    console_error(
                        0,
                        this._Entity.className(),
                        `get_Tokens_With_Price_And_Signature_From_ExternalOracle - Oracle Data for Token ${CS + ' ' + hexToStr(TN_Hex)} was not retrieved`
                    );
                    // throw `Oracle Data for Token ${CS + ' ' + hexToStr(TN_Hex)} was not retrieved`;
                    //  NOTE:va a continuar sin tirar error y va a ser quien llama que va a decidir que hacer, si tira eroro o si crea mocking precio
                    //-------------------------
                }
            }
            //-------------------------
            console_log(-1, this._Entity.className(), `get_Tokens_With_Price_And_Signature_From_ExternalOracle - All tokens processed - OK`);
            //-------------------------
            return tokenPricesExternalOracleResult;
            //-------------------------
        } catch (error) {
            //-------------------------
            console_error(-1, this._Entity.className(), `get_Tokens_With_Price_And_Signature_From_ExternalOracle - Error: ${error}`);
            //-------------------------
            throw error;
            //-------------------------
        }
    }

    public static async get_Tokens_PriceData_From_ExternalOracleApi(
        tokensInfo: OracleExternalToken[],
        forceRefresh: boolean = false,
        validityMS?: number,
        forceUseOracle: boolean = false
    ): Promise<Token_With_Price_And_Date_And_Signature[]> {
        //----------------------------
        const MAX_ATTEMPTS = 3;
        const RETRY_DELAY_MS = 1000;
        //----------------------------
        const fetchWithRetry = async (url: string, options: RequestInit): Promise<Token_With_Price_And_Date_And_Signature[]> => {
            let attempts = 0;
            while (attempts < MAX_ATTEMPTS) {
                try {
                    // console_log(0, this._Entity.className(), `get_Tokens_PriceData_From_ExternalOracleApi - Fetching ${url} - Attempt ${attempts + 1}/${MAX_ATTEMPTS}`);
                    const response = await fetchWrapperBackEnd(url, options);
                    switch (response.status) {
                        case 200: {
                            const data = await response.json();
                            console_log(0, this._Entity.className(), `get_Tokens_PriceData_From_ExternalOracleApi - Token Fetch: ${showData(data)} - reponse OK`);
                            return data;
                        }
                        case 404: {
                            console_error(0, this._Entity.className(), `get_Tokens_PriceData_From_ExternalOracleApi - 404 Not Found: ${url}`);
                            return [];
                        }
                        default: {
                            const errorData = await response.json();
                            throw `${errorData.error.message ? errorData.error.message : errorData.error} - url: ${url}`;
                        }
                    }
                } catch (error) {
                    attempts++;
                    console_error(0, this._Entity.className(), `get_Tokens_PriceData_From_ExternalOracleApi - Attempt ${attempts}/${MAX_ATTEMPTS} failed: ${error}`);
                    if (attempts >= MAX_ATTEMPTS) {
                        console_error(0, this._Entity.className(), `get_Tokens_PriceData_From_ExternalOracleApi - Failed after ${MAX_ATTEMPTS} attempts: ${error}`);
                        return []; // Devolver null si falla tras todos los intentos
                    }

                    // Esperar antes de reintentar
                    await sleep(RETRY_DELAY_MS);
                }
            }
            return [];
        };
        //----------------------------
        try {
            const groupedByApi = tokensInfo.reduce<Record<string, OracleExternalToken[]>>((acc, token) => {
                acc[token.Api] = acc[token.Api] || [];
                acc[token.Api].push(token);
                return acc;
            }, {});
            //----------------------------
            const promises = Object.entries(groupedByApi).map(async ([api, tokens]) => {
                const tokensPayload = tokens.map((token) => ({
                    CS: token.CS,
                    TN_Hex: token.TN_Hex,
                }));
                const body = JSON.stringify({
                    tokens: tokensPayload,
                    forceRefresh,
                    validityMS,
                    forceUseOracle,
                });
                const requestOptions: RequestInit = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                };
                const data = await fetchWithRetry(api, requestOptions);
                return data;
            });
            // Ejecutar todas las promesas y consolidar respuestas exitosas
            const results = await Promise.all(promises);
            // Filtrar resultados exitosos y combinar en una lista
            const mergedResults: Token_With_Price_And_Date_And_Signature[] = results.flat();
            return mergedResults;
        } catch (error) {
            console_error(0, this._Entity.className(), `get_Tokens_PriceData_From_ExternalOracleApi - Error: ${error}`);
            throw error;
        }
    }

    public static async set_Token_PriceADAx1e6(CS: CS, TN_Hex: TN, priceADAx1e6: bigint): Promise<Token_With_Price_And_Date_And_Signature | undefined> {
        if (CS === undefined || TN_Hex === undefined) {
            throw `CS or TN_Hex not defined`;
        }
        const isADA = isTokenADA(CS, TN_Hex);
        if (isADA) {
            CS = '';
        }
        if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
            throw `CS or TN_Hex not valid`;
        }
        //----------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `set_Token_PriceADAx1e6 - Init - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - priceADAx1e6: ${priceADAx1e6}`);
        //----------------------------
        const lucid = await getGlobalLucid();
        //--------------------------------------
        if (isADA) {
            //----------------------------
            const priceADAx1e6 = 1_000_000n;
            //----------------------------
            const token: Token_With_Price_And_Date_And_Signature = { CS: '', TN_Hex: '', priceADAx1e6, date: undefined, signature: undefined };
            //----------------------------
            console_log(-1, this._Entity.className(), `set_Token_PriceADAx1e6 - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - priceADAx1e6 - ${showData(token.priceADAx1e6)} - OK`);
            //----------------------------
            return token;
        }
        //----------------------------
        console_log(0, this._Entity.className(), `set_Token_PriceADAx1e6 - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - Setting NEW Price`);
        //----------------------------
        const token: Token_With_Price_And_Date_And_Signature = await this.createNewPriceDBAndReturnToken(lucid, CS, TN_Hex, priceADAx1e6);
        //----------------------------
        console_log(-1, this._Entity.className(), `set_Token_PriceADAx1e6 - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - priceADAx1e6 - ${showData(token.priceADAx1e6)} - OK`);
        //----------------------------
        return token;
    }
    // #endregion class methods
}
