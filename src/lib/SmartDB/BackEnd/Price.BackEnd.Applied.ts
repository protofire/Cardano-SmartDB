import { hexToStr, isEmptyObject, isFrontEndEnvironment, showData, sleep, strToHex, toJson } from '@/src/utils/commons/utils';
import { LUCID_NETWORK_MAINNET_INT, PRICEx1e6, VALID_PRICE_TIME_MS, useOraclePrices } from '@/src/utils/specific/constants';
import { C, Lucid, SignedMessage } from 'lucid-cardano';
import {
    Ed25519KeyHashToAddress,
    Token_With_Price_And_Date,
    Token_With_Price_And_Date_And_Signature,
    formatHash,
    isTokenADA,
    isToken_CS_And_TN_Valid,
    type CS,
    type TN,
} from '../Commons';
import { console_error, console_log } from '../Commons/BackEnd/globalLogs';
import { getGlobalLucid } from '../Commons/BackEnd/globalLucid';
import { BackEndAppliedFor } from '../Commons/Decorator.BackEndAppliedFor';
import { PriceEntity } from '../Entities/Price.Entity';
import { TimeBackEnd } from '../lib/Time/backEnd';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods';
import { globalSettings } from '../Commons/BackEnd/globalSettings';

@BackEndAppliedFor(PriceEntity)
export class PriceBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = PriceEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    protected static async get_Actual_PriceDB_Of_Token(CS: CS, TN_Hex: TN, now?: number, validityMS?: number) {
        //----------------------------
        if (CS === undefined || TN_Hex === undefined) {
            throw `CS or TN not defined`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `get_Actual_PriceDB_Of_Token - Init - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - now: ${now} - validityMS: ${validityMS}`);
        //----------------------------
        const currentTime = now !== undefined ? now : await TimeBackEnd.getServerTime();
        //--------------------------------------
        validityMS = validityMS ?? VALID_PRICE_TIME_MS;
        //--------------------------------------
        const cutoffTime = currentTime - validityMS;
        const priceDB: PriceEntity | undefined = await this.getOneByParams_({ CS, TN_Hex, date: { $gte: new Date(cutoffTime).toISOString() } }, { sort: { date: -1 } });
        //----------------------------
        console_log(-1, this._Entity.className(), `get_Actual_PriceDB_Of_Token - priceDB: ${showData(priceDB)} - OK`);
        //----------------------------
        return priceDB;
    }

    protected static async get_Actual_PricesDB_Of_Tokens(tokens: { CS: CS; TN_Hex: TN }[], now?: number, validityMS?: number): Promise<PriceEntity[]> {
        //----------------------------
        if (tokens.length === 0 || tokens.some((token) => token.CS === undefined || token.TN_Hex === undefined)) {
            throw `CS or TN not defined`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `get_Actual_PricesDB_Of_Tokens - Init - tokens: ${tokens.map((token) => `${formatHash(token.CS)}, ${hexToStr(token.TN_Hex)}`)}`);
        //----------------------------
        const currentTime = now !== undefined ? now : await TimeBackEnd.getServerTime();
        //--------------------------------------
        validityMS = validityMS ?? VALID_PRICE_TIME_MS;
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
        //----------------------------
        if (CS === undefined || TN_Hex === undefined) {
            throw `CS or TN not defined`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `get_LastPriceDB_Of_Token - Init - ${formatHash(CS)}, ${hexToStr(TN_Hex)}`);
        const priceDB: PriceEntity | undefined = await this.getOneByParams_({ CS, TN_Hex }, { sort: { date: -1 } });
        console_log(-1, this._Entity.className(), `get_LastPriceDB_Of_Token - priceDB: ${priceDB?.show()} - OK`);
        return priceDB;
    }

    public static async get_LastPricesDB_Of_Tokens(tokens: { CS: CS; TN_Hex: TN }[]): Promise<PriceEntity[]> {
        //----------------------------
        if (tokens.length === 0 || tokens.some((token) => token.CS === undefined || token.TN_Hex === undefined)) {
            throw `CS or TN not defined`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `get_LastPricesDB_Of_Tokens - Init - tokens: ${tokens.map((token) => `${formatHash(token.CS)}, ${hexToStr(token.TN_Hex)}`)}`);
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

    protected static async delete_Old_PriceDB(CS: string, TN_Hex: string, _doNotDeleteId: string) {
        //----------------------------
        // const count = await this.getCount_({ CS, TN_Hex });
        //----------------------------
        console_log(0, this._Entity.className(), `delete_Old_PriceDB - ${formatHash(CS)}, ${hexToStr(TN_Hex)}`);
        //----------------------------
        // if (count > 10) {
        try {
            // en lugar de eliminar todo el tiempo el anterior, voy a eliminar solo si hay mas de 10, para no hacer esta operacion todo el tiempo
            // ademas lo hago en try por que si se ejecuta por otro usuario al mismo tiempo y ese lo elimina, aca arroja error
            await this.deleteByParams_({ CS, TN_Hex, _id: { $ne: _doNotDeleteId } });
        } catch (error) {
            console_log(0, this._Entity.className(), `delete_Old_PriceDB - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - Error deleting old prices: ${showData(error)}`);
        }
        // }
    }

    protected static async create_Mock_NewPriceDB_BasedIn_LastOne(lastPriceDB: PriceEntity) {
        //----------------------------
        console_log(
            0,
            this._Entity.className(),
            `create_Mock_NewPriceDB_BasedIn_LastOne - ${formatHash(lastPriceDB.CS)}, ${hexToStr(lastPriceDB.TN_Hex)} - Mocking existing Price`
        );
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
        priceADAx1e6 = priceADAx1e6 < 0n ? 1000000n : priceADAx1e6;
        //----------------------------
        const serverTime = await TimeBackEnd.getServerTime();
        //--------------------------------------
        const newToken: Token_With_Price_And_Date = { CS: lastPriceDB.CS, TN: lastPriceDB.TN_Hex, priceADAx1e6, date: BigInt(serverTime) };
        //----------------------------
        // Asi es como va a venir la data desde el Oraculo
        let dataStr = toJson(newToken);
        dataStr = dataStr.replace(/:/g, ': ').replace(/,/g, ', ').replace(/\"/g, "'");
        const dataHex = strToHex(dataStr);
        //--------------------------------------
        const lucid = await getGlobalLucid();
        //----------------------------
        const privateKeyCborHex = process.env.ORACLE_INTERNAL_WALLET_PRIVATEKEY_CBORHEX!;
        const privateKeyBytes = Buffer.from(privateKeyCborHex, 'hex');
        const privateKey = C.PrivateKey.from_bytes(privateKeyBytes);
        const privateKeyBench32 = privateKey.to_bech32();
        lucid.selectWalletFromPrivateKey(privateKeyBench32);
        const address = await lucid.wallet.address();
        //--------------------------------------
        const signature = await lucid.wallet.signMessage(address, dataHex);
        //--------------------------------------
        let priceDB = new PriceEntity();
        //----------------------------
        priceDB.CS = newToken.CS;
        priceDB.TN_Hex = newToken.TN;
        priceDB.TN_Str = hexToStr(newToken.TN);
        priceDB.priceADAx1e6 = newToken.priceADAx1e6!;
        priceDB.date = new Date(Number(newToken.date));
        priceDB.signature = signature;
        //----------------------------
        priceDB = await this.create(priceDB);
        //----------------------------
        await PriceBackEndApplied.delete_Old_PriceDB(priceDB.CS, priceDB.TN_Hex, priceDB._DB_id);
        //----------------------------
        const token: Token_With_Price_And_Date_And_Signature = { ...newToken, signature };
        //----------------------------
        return token;
    }

    protected static async create_Mock_NewPriceDB(CS: string, TN_Hex: string) {
        //----------------------------
        console_log(0, this._Entity.className(), `create_Mock_NewPriceDB - ${formatHash(CS)}, ${hexToStr(TN_Hex)}`);
        //----------------------------
        // creo un precio falso
        const priceADAx1e6 = 10000000n;
        //----------------------------
        const serverTime = await TimeBackEnd.getServerTime();
        //--------------------------------------
        const newToken: Token_With_Price_And_Date = { CS, TN: TN_Hex, priceADAx1e6, date: BigInt(serverTime) };
        //----------------------------
        // Asi es como va a venir la data desde el Oraculo
        let dataStr = toJson(newToken);
        dataStr = dataStr.replace(/:/g, ': ').replace(/,/g, ', ').replace(/\"/g, "'");
        // console.log(`dataStr = ${dataStr}\n`);
        const dataHex = strToHex(dataStr);
        // console.log(`dataHex = ${dataHex}\n`);
        //--------------------------------------
        const lucid = await getGlobalLucid();
        //----------------------------
        const privateKeyCborHex = process.env.ORACLE_INTERNAL_WALLET_PRIVATEKEY_CBORHEX!;
        const privateKeyBytes = Buffer.from(privateKeyCborHex, 'hex');
        const privateKey = C.PrivateKey.from_bytes(privateKeyBytes);
        const privateKeyBench32 = privateKey.to_bech32();
        lucid.selectWalletFromPrivateKey(privateKeyBench32);
        const address = await lucid.wallet.address();
        // console.log(`address = ${address}\n`);
        //--------------------------------------
        const signature = await lucid.wallet.signMessage(address, dataHex);
        //--------------------------------------
        let priceDB = new PriceEntity();
        //----------------------------
        priceDB.CS = newToken.CS;
        priceDB.TN_Hex = newToken.TN;
        priceDB.TN_Str = hexToStr(newToken.TN);
        priceDB.priceADAx1e6 = newToken.priceADAx1e6!;
        priceDB.date = new Date(Number(newToken.date));
        priceDB.signature = signature;
        //----------------------------
        priceDB = await this.create(priceDB);
        //----------------------------
        await PriceBackEndApplied.delete_Old_PriceDB(priceDB.CS, priceDB.TN_Hex, priceDB._DB_id);
        //----------------------------
        let token: Token_With_Price_And_Date_And_Signature = { ...newToken, signature };
        //----------------------------
        return token;
    }

    public static async get_Tokens_With_Price_And_Signature(
        tokens: { CS: CS; TN_Hex: TN }[],
        forceRefresh: boolean = false,
        validityMS?: number,
        forceUseOracle: boolean = false
    ): Promise<Token_With_Price_And_Date_And_Signature[]> {
        //----------------------------
        if (tokens.length === 0 || tokens.some((token) => token.CS === undefined || token.TN_Hex === undefined)) {
            throw `CS or TN not defined`;
        }
        //----------------------------
        // const isADA = isTokenADA(CS, TN_Hex);
        // if (isADA) {
        //     CS = '';
        // }
        //----------------------------
        if (!tokens.every((token) => isToken_CS_And_TN_Valid(token.CS, token.TN_Hex))) {
            throw `CS or TN not valid`;
        }
        //----------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        console_log(
            1,
            this._Entity.className(),
            `get_Tokens_With_Price_And_Signature - Init - tokens.length: ${tokens.length} - forceRefresh: ${forceRefresh} - forceUseOracle: ${forceUseOracle}`
        );
        //----------------------------
        const tokensThatAreADA = tokens.filter((token) => isTokenADA(token.CS, token.TN_Hex));
        const tokensThatAreNotADA = tokens.filter((token) => !isTokenADA(token.CS, token.TN_Hex));
        //--------------------------------------
        const tokensThatAreADAWithPrice = tokensThatAreADA.map((token) => {
            const priceADAx1e6 = 1_000_000n;
            const tokenWithPrice: Token_With_Price_And_Date_And_Signature = { CS: '', TN: '', priceADAx1e6, date: undefined, signature: undefined };
            return tokenWithPrice;
        });
        //--------------------------------------
        if (tokensThatAreNotADA.length === 0) {
            console_log(-1, this._Entity.className(), `get_Tokens_With_Price_And_Signature - OK`);
            return tokensThatAreADAWithPrice;
        }
        //--------------------------------------
        let pricesDB: PriceEntity[] = [];
        //----------------------------
        if (forceRefresh === false) {
            //----------------------------
            const serverTime = await TimeBackEnd.getServerTime();
            //--------------------------------------
            pricesDB = await this.get_Actual_PricesDB_Of_Tokens(tokensThatAreNotADA, serverTime, validityMS);
        }
        //--------------------------------------
        let tokens_With_PriceDB: Token_With_Price_And_Date_And_Signature[] = [];
        //--------------------------------------
        for (const token_ of pricesDB) {
            //----------------------------
            const token = { CS: token_.CS, TN: token_.TN_Hex, priceADAx1e6: token_.priceADAx1e6, date: BigInt(token_.date.getTime()), signature: token_.signature };
            //----------------------------
            console_log(
                0,
                this._Entity.className(),
                `get_Tokens_With_Price_And_Signature - ${formatHash(token_.CS)}, ${hexToStr(token_.TN_Hex)} - PriceDB found - ${showData(token.priceADAx1e6)} - OK`
            );
            //----------------------------
            tokens_With_PriceDB.push(token);
        }
        //--------------------------------------
        // check what tokensThatAreNotADA are not present in pricesDB
        const tokensThatAreNotADA_With_No_PriceDB = tokensThatAreNotADA.filter((token) => !pricesDB.some((priceDB) => priceDB.CS === token.CS && priceDB.TN_Hex === token.TN_Hex));
        let tokensThatAreNotADA_With_No_PriceDB_Now_Ready: Token_With_Price_And_Date_And_Signature[] = [];
        //--------------------------------------
        for (const token_ of tokensThatAreNotADA_With_No_PriceDB) {
            //--------------------------------------
            let token: Token_With_Price_And_Date_And_Signature | undefined = undefined;
            //--------------------------------------
            if (useOraclePrices === true || forceUseOracle === true) {
                //--------------------------------------
                console_log(
                    0,
                    this._Entity.className(),
                    `get_Tokens_With_Price_And_Signature - ${formatHash(token_.CS)}, ${hexToStr(
                        token_.TN_Hex
                    )} - PriceDB not found or forced refresh: ${forceRefresh} - Fetching it from Oracle...`
                );
                //--------------------------------------
                token = await this.get_Token_With_Price_And_Signature_From_Oracle(token_.CS, token_.TN_Hex);
                //--------------------------------------
                if (token === undefined) {
                    //----------------------------
                    console_log(0, this._Entity.className(), `get_Tokens_With_Price_And_Signature - Oracle does not have this token - Mocking Price...`);
                    //----------------------------
                    const lastPriceDB: PriceEntity | undefined = await this.get_LastPriceDB_Of_Token(token_.CS, token_.TN_Hex);
                    //----------------------------
                    if (lastPriceDB === undefined) {
                        token = await PriceBackEndApplied.create_Mock_NewPriceDB(token_.CS, token_.TN_Hex);
                    } else {
                        token = await PriceBackEndApplied.create_Mock_NewPriceDB_BasedIn_LastOne(lastPriceDB);
                    }
                }
            }
            {
                //----------------------------
                console_log(0, this._Entity.className(), `get_Tokens_With_Price_And_Signature - PriceDB not found or forced refresh: ${forceRefresh} - Mocking Price...`);
                //----------------------------
                const lastPriceDB: PriceEntity | undefined = await this.get_LastPriceDB_Of_Token(token_.CS, token_.TN_Hex);
                //----------------------------
                if (lastPriceDB === undefined) {
                    token = await PriceBackEndApplied.create_Mock_NewPriceDB(token_.CS, token_.TN_Hex);
                } else {
                    token = await PriceBackEndApplied.create_Mock_NewPriceDB_BasedIn_LastOne(lastPriceDB);
                }
            }
            //--------------------------------------
            if (token !== undefined) {
                tokensThatAreNotADA_With_No_PriceDB_Now_Ready.push(token);
            }
        }
        console_log(
            -1,
            this._Entity.className(),
            `get_Tokens_With_Price_And_Signature - tokens_With_Price_And_Date_And_Signature.length: ${tokensThatAreNotADA_With_No_PriceDB_Now_Ready.length}`
        );
        //--------------------------------------
        return [...tokens_With_PriceDB, ...tokensThatAreNotADA_With_No_PriceDB_Now_Ready, ...tokensThatAreADAWithPrice];
        //--------------------------------------
    }

    public static async get_Token_With_Price_And_Signature(
        CS: CS,
        TN_Hex: TN,
        forceRefresh: boolean = false,
        validityMS?: number,
        forceUseOracle: boolean = false
    ): Promise<Token_With_Price_And_Date_And_Signature | undefined> {
        if (CS === undefined || TN_Hex === undefined) {
            throw `CS or TN not defined`;
        }
        const isADA = isTokenADA(CS, TN_Hex);
        if (isADA) {
            CS = '';
        }
        if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
            throw `CS or TN not valid`;
        }
        //----------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        console_log(
            1,
            this._Entity.className(),
            `get_Token_With_Price_And_Signature - Init - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - forceRefresh: ${forceRefresh} - forceUseOracle: ${forceUseOracle}`
        );
        //----------------------------
        if (isADA) {
            const priceADAx1e6 = 1_000_000n;
            //----------------------------
            const token: Token_With_Price_And_Date_And_Signature = { CS: '', TN: '', priceADAx1e6, date: undefined, signature: undefined };
            //----------------------------
            console_log(
                -1,
                this._Entity.className(),
                `get_Token_With_Price_And_Signature - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - priceADAx1e6 - ${showData(token.priceADAx1e6)} - OK`
            );
            //----------------------------
            return token;
        }
        //----------------------------
        let priceDB: PriceEntity | undefined = undefined;
        let token: Token_With_Price_And_Date_And_Signature | undefined;
        //----------------------------
        if (forceRefresh === false) {
            //----------------------------
            const serverTime = await TimeBackEnd.getServerTime();
            //--------------------------------------
            priceDB = await this.get_Actual_PriceDB_Of_Token(CS, TN_Hex, serverTime, validityMS);
        }
        //----------------------------
        if (priceDB !== undefined) {
            //----------------------------
            token = { CS: priceDB.CS, TN: priceDB.TN_Hex, priceADAx1e6: priceDB.priceADAx1e6, date: BigInt(priceDB.date.getTime()), signature: priceDB.signature };
            //----------------------------
            console_log(
                -1,
                this._Entity.className(),
                `get_Token_With_Price_And_Signature - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - PriceDB found - ${showData(token.priceADAx1e6)} - OK`
            );
            //----------------------------
            return token;
        } else {
            //--------------------------------------
            let token: Token_With_Price_And_Date_And_Signature | undefined = undefined;
            //--------------------------------------
            if (useOraclePrices === true || forceUseOracle === true) {
                console_log(
                    0,
                    this._Entity.className(),
                    `get_Token_With_Price_And_Signature - ${formatHash(CS)}, ${hexToStr(
                        TN_Hex
                    )} - PriceDB not found or forced refresh: ${forceRefresh} - Fetching it from Oracle...`
                );
                token = await this.get_Token_With_Price_And_Signature_From_Oracle(CS, TN_Hex);
                //--------------------------------------
                if (token === undefined) {
                    //----------------------------
                    console_log(0, this._Entity.className(), `get_Token_With_Price_And_Signature - Oracle does not have this token - Mocking Price...`);
                    //----------------------------
                    const lastPriceDB: PriceEntity | undefined = await this.get_LastPriceDB_Of_Token(CS, TN_Hex);
                    //----------------------------
                    if (lastPriceDB === undefined) {
                        token = await PriceBackEndApplied.create_Mock_NewPriceDB(CS, TN_Hex);
                    } else {
                        token = await PriceBackEndApplied.create_Mock_NewPriceDB_BasedIn_LastOne(lastPriceDB);
                    }
                }
            } else {
                //----------------------------
                console_log(0, this._Entity.className(), `get_Tokens_With_Price_And_Signature - PriceDB not found or forced refresh: ${forceRefresh} - Mocking Price...`);
                //----------------------------
                const lastPriceDB: PriceEntity | undefined = await this.get_LastPriceDB_Of_Token(CS, TN_Hex);
                //----------------------------
                if (lastPriceDB === undefined) {
                    token = await PriceBackEndApplied.create_Mock_NewPriceDB(CS, TN_Hex);
                } else {
                    token = await PriceBackEndApplied.create_Mock_NewPriceDB_BasedIn_LastOne(lastPriceDB);
                }
            }
            //--------------------------------------
            return token;
        }
    }

    public static async get_Token_With_Price_And_Signature_From_Oracle(CS: CS, TN_Hex: TN): Promise<Token_With_Price_And_Date_And_Signature | undefined> {
        //----------------------------
        console_log(1, this._Entity.className(), `get_Token_With_Price_And_Signature_From_Oracle - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - Init`);
        //--------------------------------------
        const lucid = await getGlobalLucid();
        //----------------------------
        // uso la public key para validar la firma de los tokens, para eso obtengo primero la key hash y la address
        const publicKeyCborHex = globalSettings.siteSettings!.oracle_internal_wallet_publickey_cborhex;
        const publicKeyBytes = Buffer.from(publicKeyCborHex, 'hex');
        const publicKey = C.PublicKey.from_bytes(publicKeyBytes);
        const publicKeyHash = publicKey.hash();
        const oracleInternalWalletAddress = Ed25519KeyHashToAddress(LUCID_NETWORK_MAINNET_INT, publicKeyHash);
        //----------------------------
        let oracleDataPricesDict: Record<string, any> = {};
        //----------------------------
        // TODO: esta tiene que ser la key real en mainnet, pero en testnet solo busco por tokenname
        // const tokenKey = `${CS}${hexToStr(TN_Hex)}`;
        const tokenKey = `${hexToStr(TN_Hex)}`;
        //----------------------------
        let token: Token_With_Price_And_Date_And_Signature | undefined;
        //----------------------------
        try {
            //----------------------------
            oracleDataPricesDict = await this.get_Token_PriceData_From_OracleApi(CS, TN_Hex);
            //----------------------------
            const oracleData = oracleDataPricesDict[tokenKey];
            //----------------------------
            if (oracleData !== undefined && !isEmptyObject(oracleData.data)) {
                //----------------------------
                const dataPrices = oracleData.data;
                // console.log(`data = ${JSON.stringify(dataPrices)}\n`);
                let dataStr = JSON.stringify(dataPrices);
                dataStr = dataStr.replace(/:/g, ': ').replace(/,/g, ', ').replace(/\"/g, "'");
                // console.log(`dataStr = ${dataStr}\n`);
                const dataHex = strToHex(dataStr);
                // console.log(`dataHex = ${dataHex}\n`);
                //----------------------------
                const sigLucid: SignedMessage = {
                    key: oracleData.sig_msg.key,
                    signature: oracleData.sig_msg.signature,
                };
                //----------------------------
                if (await lucid.verifyMessage(oracleInternalWalletAddress, dataHex, sigLucid)) {
                    //--------------------------------------
                    let priceDB = new PriceEntity();
                    //----------------------------
                    priceDB.CS = CS;
                    priceDB.TN_Hex = TN_Hex;
                    priceDB.TN_Str = hexToStr(TN_Hex);
                    priceDB.priceADAx1e6 = BigInt(Math.round(Number(dataPrices.price * PRICEx1e6)));
                    priceDB.date = new Date(Number(dataPrices.execution_time) * 1000);
                    priceDB.signature = sigLucid;
                    //--------------------------------------
                    priceDB = await this.create(priceDB);
                    //----------------------------
                    await PriceBackEndApplied.delete_Old_PriceDB(priceDB.CS, priceDB.TN_Hex, priceDB._DB_id);
                    //----------------------------
                    token = {
                        CS,
                        TN: TN_Hex,
                        priceADAx1e6: priceDB.priceADAx1e6,
                        date: BigInt(priceDB.date.getTime()),
                        signature: priceDB.signature,
                    };
                    //----------------------------
                    console_log(0, this._Entity.className(), `get_Token_With_Price_And_Signature_From_Oracle - Got Oracle - OK`);
                    //----------------------------
                } else {
                    console_log(-1, this._Entity.className(), `Token ${dataPrices.policyID + ' ' + dataPrices.name} has invalid signature`);
                    throw `Token ${dataPrices.policyID + ' ' + dataPrices.name} has invalid signature`;
                }
            } else {
                console_error(0, this._Entity.className(), `Oracle Data for Token ${CS + ' ' + hexToStr(TN_Hex)} was not retrieved`);
                // throw `Oracle Data for Token ${CS + ' ' + hexToStr(TN_Hex)} was not retrieved`;
                // va a continuar sin tirar error y va a ser quien llama que va a decidir que hacer, si tira eroro o si crea mocking precio
            }
            console_log(
                -1,
                this._Entity.className(),
                `get_Token_With_Price_And_Signature - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - Price - ${showData(token?.priceADAx1e6)} - OK`
            );
            //----------------------------
            return token;
        } catch (error) {
            console_error(-1, `Helpers`, `get_Token_With_Price_And_Signature_From_Oracle - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async get_Token_PriceData_From_OracleApi(CS: CS, TN_Hex: TN): Promise<Record<string, any>> {
        //----------------------------
        // console.log("get_Token_PriceData_From_OracleApi: " + log(token))
        //----------------------------
        const body = toJson({ tokens: [{ name: hexToStr(TN_Hex) }] });
        //----------------------------
        const rute = '/tokens/prices';
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
            await sleep(2000) // HACK: para que no se llame tan seguido al oraculo
            //----------------------------
            const response = await fetch(urlApi, requestOptions);
            //----------------------------
            switch (response.status) {
                case 200: {
                    const data = await response.json();
                    console_log(0, `Helpers`, ` get_Token_PriceData_From_OracleApi - Data: ${showData(data)} - reponse OK`);
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
            console_error(0, `Helpers`, ` get_Token_PriceData_From_OracleApi - Error: ${error} - url: ${urlApi}`);
            throw `${error}`;
        }
    }

    public static async set_Token_PriceADAx1e6(CS: CS, TN_Hex: TN, priceADAx1e6: bigint): Promise<Token_With_Price_And_Date_And_Signature | undefined> {
        if (CS === undefined || TN_Hex === undefined) {
            throw `CS or TN not defined`;
        }
        const isADA = isTokenADA(CS, TN_Hex);
        if (isADA) {
            CS = '';
        }
        if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
            throw `CS or TN not valid`;
        }
        //----------------------------
        if (isFrontEndEnvironment()) {
            //return await this.set_Token_PriceADAx1e6_Api(CS, TN_Hex);
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
            const token: Token_With_Price_And_Date_And_Signature = { CS: '', TN: '', priceADAx1e6, date: undefined, signature: undefined };
            //----------------------------
            console_log(-1, this._Entity.className(), `set_Token_PriceADAx1e6 - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - priceADAx1e6 - ${showData(token.priceADAx1e6)} - OK`);
            return token;
        }
        //----------------------------
        let token: Token_With_Price_And_Date_And_Signature;
        //----------------------------
        console_log(0, this._Entity.className(), `set_Token_PriceADAx1e6 - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - Setting NEW Price`);
        //----------------------------
        const serverTime = await TimeBackEnd.getServerTime();
        //--------------------------------------
        const newToken: Token_With_Price_And_Date = { CS, TN: TN_Hex, priceADAx1e6, date: BigInt(serverTime) };
        //----------------------------
        // Asi es como va a venir la data desde el Oraculo
        let dataStr = toJson(newToken);
        dataStr = dataStr.replace(/:/g, ': ').replace(/,/g, ', ').replace(/\"/g, "'");
        // console.log(`dataStr = ${dataStr}\n`);
        const dataHex = strToHex(dataStr);
        // console.log(`dataHex = ${dataHex}\n`);
        //--------------------------------------
        const privateKeyCborHex = process.env.ORACLE_INTERNAL_WALLET_PRIVATEKEY_CBORHEX!;
        const privateKeyBytes = Buffer.from(privateKeyCborHex, 'hex');
        const privateKey = C.PrivateKey.from_bytes(privateKeyBytes);
        const privateKeyBench32 = privateKey.to_bech32();
        lucid.selectWalletFromPrivateKey(privateKeyBench32);
        const address = await lucid.wallet.address();
        //--------------------------------------
        const signature = await lucid.wallet.signMessage(address, dataHex);
        //--------------------------------------
        let priceDB = new PriceEntity();
        //----------------------------
        priceDB.CS = newToken.CS;
        priceDB.TN_Hex = newToken.TN;
        priceDB.TN_Str = hexToStr(newToken.TN);
        priceDB.priceADAx1e6 = newToken.priceADAx1e6!;
        priceDB.date = new Date(Number(newToken.date));
        priceDB.signature = signature;
        //----------------------------
        priceDB = await this.create(priceDB);
        //----------------------------
        await PriceBackEndApplied.delete_Old_PriceDB(priceDB.CS, priceDB.TN_Hex, priceDB._DB_id);
        //----------------------------
        token = { ...newToken, signature };
        //----------------------------
        console_log(-1, this._Entity.className(), `set_Token_PriceADAx1e6 - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - priceADAx1e6 - ${showData(token.priceADAx1e6)} - OK`);
        //----------------------------
        return token;
    }
    // #endregion class methods
}
