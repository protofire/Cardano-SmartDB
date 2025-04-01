import { NextApiResponse } from 'next';
import { console_error, console_log } from '../Commons/BackEnd/globalLogs.js';
import { BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import {
    BackEndApiHandlersFor,
    calculateBackoffDelay,
    CS,
    generateRandomColor,
    hexToStr,
    isEmulator,
    isFrontEndEnvironment,
    isToken_CS_And_TN_Valid,
    isTokenADA,
    JOB_MAX_TIME_WAITING_TO_COMPLETE_MS,
    JOB_TIME_WAITING_TO_TRY_AGAIN_MS,
    OptionsGet,
    sanitizeForDatabase,
    showData,
    sleep,
    TN,
    toJson,
    TOKEN_ADA_DECIMALS,
    TOKEN_ADA_TICKER,
    TOKEN_COLOR_ADA,
    TOKEN_DEFAULT_DECIMALS,
    yupValidateOptionsGet,
} from '../Commons/index.js';
import { yup } from '../Commons/yupLocale.js';
import { TokenMetadataEntity } from '../Entities/Token.Metadata.Entity.js';
import { NextApiRequestAuthenticated } from '../lib/Auth/backEnd.js';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';
import { JobEntity } from '../Entities/Job.Entity.js';
import { JobBackEndApplied } from './Job.BackEnd.All.js';
import fetchWrapperBackEnd from '../lib/FetchWrapper/FetchWrapper.BackEnd.js';

@BackEndAppliedFor(TokenMetadataEntity)
export class TokenMetadataBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = TokenMetadataEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    public static async get_Token_Metadata(
        CS: CS,
        TN_Hex: TN,
        forceRefresh: boolean = false,
        swCreateMetadataWhenNotFound: boolean = true,
        optionsGet?: OptionsGet
    ): Promise<TokenMetadataEntity> {
        //--------------------------------------
        const tokensMetadata: TokenMetadataEntity[] = await this.get_Tokens_MetadataWrapper([{ CS, TN_Hex }], forceRefresh, swCreateMetadataWhenNotFound, optionsGet);
        //--------------------------------------
        const tokenMetadata: TokenMetadataEntity | undefined = tokensMetadata.find((token_) => token_.CS === CS && token_.TN_Hex === TN_Hex);
        //--------------------------------------
        if (tokenMetadata === undefined) {
            throw `tokenMetadata is undefined`;
        }
        //--------------------------------------
        return tokenMetadata;
        //--------------------------------------
    }

    public static async get_Tokens_MetadataWrapper(
        tokens: { CS: CS; TN_Hex: TN }[],
        forceRefresh: boolean = false,
        swCreateMetadataWhenNotFound: boolean = true,
        optionsGet?: OptionsGet
    ): Promise<TokenMetadataEntity[]> {
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
        try {
            //----------------------------
            console_log(1, this._Entity.className(), `get_Tokens_MetadataWrapper - Ini`);
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
            let retries = 0;
            const startTime = Date.now();
            const maxWaitTimeMs = JOB_MAX_TIME_WAITING_TO_COMPLETE_MS;
            const retryDelayMs = JOB_TIME_WAITING_TO_TRY_AGAIN_MS;
            //----------------------------
            const tokenRegexArray = tokens.filter((token) => !isTokenADA(token.CS, token.TN_Hex)).map((token) => ({ name: `/getTokensMetadata-.*${token.CS}${token.TN_Hex}.*/i` }));
            //----------------------------
            while (Date.now() - startTime < maxWaitTimeMs) {
                //----------------------------
                // este loop va a intentar obtener los metadatos desde la bd para evitar fetch a blockfrost en simultaneo
                // va a iterar mientras exista algun job de alguno de estos tokens
                // en cada iteracion va a leer la db de nuevo, cosa que si el job que esta corriendo ya los guardo, los tome desde ahi
                // si no estan en la db o si no hay job, va a salir del loop y crear el job
                //----------------------------
                if (forceRefresh === false) {
                    // Construct the OR condition for batch fetching
                    const orConditions = tokens.map((token) => ({ CS: token.CS, TN_Hex: token.TN_Hex }));
                    //----------------------------
                    // Fetch metadata using OR condition
                    const tokensMetadata: TokenMetadataEntity[] = await this.getByParams_({ $or: orConditions }, optionsGet);
                    if (tokensMetadata.length === Object.keys(tokens).length) {
                        console_log(0, this._Entity.className(), `get_Tokens_MetadataWrapper - Metadatas len - ${tokensMetadata.length} - Found in DB`);
                        return tokensMetadata;
                    } else {
                        console_log(0, this._Entity.className(), `get_Tokens_MetadataWrapper - Metadatas len - ${tokensMetadata.length} - Not found in DB, will try with Job...`);
                    }
                }
                //----------------------------
                let josb: JobEntity[] = await this.getByParams_({
                    $and: [{ $or: tokenRegexArray }, { $or: [{ status: 'running' }, { status: 'pending' }] }],
                });
                //----------------------------
                console_log(
                    0,
                    this._Entity.className(),
                    `get_Tokens_MetadataWrapper - Checking if Job exist - Jobs len - ${josb.length} - tokenRegexArray: ${toJson(tokenRegexArray)}`
                );
                //----------------------------
                if (josb.length > 0) {
                    retries++;
                    // Add exponential backoff with jitter
                    const backoffDelay = calculateBackoffDelay(retryDelayMs, retries);
                    console_log(
                        0,
                        this._Entity.className(),
                        `get_Tokens_MetadataWrapper - There are existings jobs - retryDelayMs: ${retryDelayMs} - retries: ${retries} - Waiting ${backoffDelay} ms before retrying...`
                    );
                    await sleep(backoffDelay);
                } else {
                    break;
                }
            }
            //----------------------------
            console_log(0, this._Entity.className(), `get_Tokens_MetadataWrapper - Creating new Job...`);
            //----------------------------
            const tokensStr = tokens
                .filter((token) => !isTokenADA(token.CS, token.TN_Hex))
                .map((token) => `${token.CS}${token.TN_Hex}`)
                .join('-');
            const jobId = `getTokensMetadata-${tokensStr}`;
            //----------------------------
            return await JobBackEndApplied.executeWithJobLock(
                jobId,
                async () => {
                    return this.get_Tokens_Metadata_(tokens, forceRefresh, swCreateMetadataWhenNotFound, optionsGet);
                },
                {
                    description: `Fetching creating and updating metadata for tokens: ${tokensStr}`,
                    swLog: true,
                }
            );
        } finally {
            console_log(-1, this._Entity.className(), `get_Tokens_MetadataWrapper - End`);
        }
    }

    public static async get_Tokens_Metadata_(
        tokens: { CS: CS; TN_Hex: TN }[],
        forceRefresh: boolean = false,
        swCreateMetadataWhenNotFound: boolean = true,
        optionsGet?: OptionsGet
    ): Promise<TokenMetadataEntity[]> {
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
        console_log(1, this._Entity.className(), `get_Tokens_Metadata - Ini`);
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
        // Construct the OR condition for batch fetching
        const orConditions = tokens.map((token) => ({ CS: token.CS, TN_Hex: token.TN_Hex }));
        //----------------------------
        // Fetch metadata using OR condition
        let tokensMetadata: TokenMetadataEntity[] = [];
        //----------------------------
        if (forceRefresh === false) {
            tokensMetadata = await this.getByParams_({ $or: orConditions }, optionsGet);
        }
        //----------------------------
        const newTokensMetadata: TokenMetadataEntity[] = [];
        //----------------------------
        console_log(0, this._Entity.className(), `Fetched metadata for ${tokensMetadata.length} tokens.`);
        //----------------------------
        for (let token of tokens) {
            //----------------------------
            let CS = token.CS;
            let TN_Hex = token.TN_Hex;
            //----------------------------
            let tokenMetadata: TokenMetadataEntity | undefined = tokensMetadata.find((metadata) => metadata.CS === CS && metadata.TN_Hex === TN_Hex);
            //----------------------------
            // cuando lo leo, estoy usando el option get, pero cuando lo creo y pido de blockfrost, luego estoy regresandolo completo
            // no es problema, por que va a suceder una sola vez, el resto de las veces deberia levantar solo los campos que pido
            // lo uso para no recibir metadata_raw
            //----------------------------
            if (tokenMetadata === undefined || forceRefresh === true) {
                //----------------------------
                // si no encontro el token, o si lo encontro pero quiero actualizarlo
                //----------------------------
                const TN_Str = hexToStr(TN_Hex);
                //----------------------------
                // const isSystemToken = checkIfIsSystemToken(CS, TN_Hex);
                // const isTokenGov = checkIfIsTokenGov(CS, TN_Hex);
                // const isTokenLP = checkIfIsLPToken(CS, TN_Hex);
                //----------------------------
                if (isTokenADA(CS, TN_Hex)) {
                    // si es ADA y no lo tengo en la base de datos, lo creo manualmente
                    const ticker: string = TOKEN_ADA_TICKER;
                    const metadata_raw: Record<string, any> | undefined = {
                        onchain_metadata: { image: '/img/tokens/ada.png' },
                        metadata: { decimals: TOKEN_ADA_DECIMALS, ticker },
                    };
                    //----------------------------
                    let newTokenMetadata = new TokenMetadataEntity();
                    //----------------------------
                    newTokenMetadata.CS = CS;
                    newTokenMetadata.TN_Str = TN_Str;
                    newTokenMetadata.TN_Hex = TN_Hex;
                    newTokenMetadata.ticker = ticker;
                    newTokenMetadata.decimals = metadata_raw.metadata.decimals;
                    newTokenMetadata.image = metadata_raw.onchain_metadata.image;
                    newTokenMetadata.colorHex = TOKEN_COLOR_ADA;
                    newTokenMetadata.metadata_raw = { ...metadata_raw };
                    newTokenMetadata.swMetadataGenerated = false; // nunca voy a querer buscar metadatas de ADA nuevamente
                    //----------------------------
                    if (tokenMetadata === undefined) {
                        newTokenMetadata = await this.create(newTokenMetadata);
                    } else {
                        // puede que haya encontrado el token antes, pero que estaba en force refresh
                        newTokenMetadata._DB_id = tokenMetadata._DB_id;
                        await this.update(newTokenMetadata);
                    }
                    //----------------------------
                    console_log(0, this._Entity.className(), `get_Tokens_Metadata - Metadata created for ADA token it manually...`);
                    //----------------------------
                    newTokensMetadata.push(newTokenMetadata);
                    //----------------------------
                } else {
                    //----------------------------
                    let metadata_raw: Record<string, any> | undefined;
                    let ticker: string;
                    let colorHex: string;
                    let swMetadataGenerated = false;
                    let swMetadataFound = true;
                    //----------------------------
                    // if (isSystemToken) {
                    //     //----------------------------
                    //     console_log(0, this._Entity.className(), `get_Tokens_Metadata - Is System Token - Creating it manually...`);
                    //     //----------------------------
                    //     colorHex = generateRandomColor();
                    //     ticker = getSystemTicker(CS, TN_Hex);
                    //     //----------------------------
                    //     metadata_raw = { onchain_metadata: { image: undefined }, metadata: { decimals: 0, ticker } };
                    //     //----------------------------
                    //     swMetadataGenerated = false; // nunca voy a querer buscar metadatas de system tokens nuevamente
                    //     //----------------------------
                    // } else if (isTokenGov) {
                    //     //----------------------------
                    //     console_log(0, this._Entity.className(), `get_Tokens_Metadata - Is Token Gov - Creating it manually...`);
                    //     //----------------------------
                    //     colorHex = TOKEN_COLOR_MAYZ;
                    //     ticker = TOKEN_GOV_TICKER;
                    //     //----------------------------
                    //     metadata_raw = { onchain_metadata: { image: TOKEN_ICON_MAYZ }, metadata: { decimals: TOKEN_GOV_DECIMALS, ticker } };
                    //     //----------------------------
                    //     swMetadataGenerated = false; // nunca voy a querer buscar metadatas de MAYZ nuevamente
                    //     //----------------------------
                    // } else if (isTokenLP) {
                    //     //----------------------------
                    //     console_log(0, this._Entity.className(), `get_Tokens_Metadata - Is Token LP - Creating it manually...`);
                    //     //----------------------------
                    //     colorHex = generateRandomColor();
                    //     ticker = TN_Str;
                    //     //----------------------------
                    //     metadata_raw = { onchain_metadata: { image: undefined }, metadata: { decimals: TOKEN_LP_DECIMALS, ticker } };
                    //     //----------------------------
                    //     swMetadataGenerated = false; // nunca voy a querer buscar metadatas de MAYZ nuevamente
                    //     //----------------------------
                    // } else 
                    if (isEmulator) {
                        //----------------------------
                        console_log(0, this._Entity.className(), `get_Tokens_Metadata - is Emulator - Creating it manually...`);
                        //----------------------------
                        colorHex = generateRandomColor();
                        ticker = TN_Str;
                        //----------------------------
                        metadata_raw = { onchain_metadata: { image: undefined }, metadata: { decimals: TOKEN_DEFAULT_DECIMALS, ticker } };
                        //----------------------------
                        swMetadataGenerated = false; // nunca voy a querer buscar metadatas en emulador nuevamente
                        //----------------------------
                    } else {
                        //----------------------------
                        console_log(0, this._Entity.className(), `get_Tokens_Metadata - Metadata not found - Fetching it from Blockfrost...`);
                        //----------------------------
                        metadata_raw = await this.get_Token_MetadataRaw_From_BlockfrostApi(CS, TN_Hex);
                        //----------------------------
                        colorHex = generateRandomColor();
                        ticker = TN_Str;
                        //----------------------------
                        if (metadata_raw === undefined) {
                            //----------------------------
                            console_log(0, this._Entity.className(), `get_Tokens_Metadata - Metadata not found - Generating default...`);
                            //----------------------------
                            metadata_raw = { onchain_metadata: { image: undefined }, metadata: { decimals: TOKEN_DEFAULT_DECIMALS, ticker } };
                            //----------------------------
                            swMetadataGenerated = true; // para intentar buscarla nuevamente en el futuro
                            swMetadataFound = false;
                            //----------------------------
                        } else {
                            if (metadata_raw.metadata?.decimals === undefined) {
                                //----------------------------
                                metadata_raw = { ...metadata_raw, metadata: { ...metadata_raw.metadata, decimals: TOKEN_DEFAULT_DECIMALS } };
                                //----------------------------
                                swMetadataGenerated = true; // para intentar buscarla nuevamente en el futuro
                                //----------------------------
                            }
                            if (metadata_raw.metadata?.ticker === undefined) {
                                //----------------------------
                                metadata_raw = { ...metadata_raw, metadata: { ...metadata_raw.metadata, ticker } };
                                //----------------------------
                                swMetadataGenerated = true; // para intentar buscarla nuevamente en el futuro
                                //----------------------------
                            }
                            if (metadata_raw?.onchain_metadata?.image === undefined || metadata_raw?.metadata?.logo === undefined) {
                                //----------------------------
                                metadata_raw = { ...metadata_raw, onchain_metadata: { ...metadata_raw.onchain_metadata, image: undefined } };
                                //----------------------------
                                swMetadataGenerated = true; // para intentar buscarla nuevamente en el futuro
                                //----------------------------
                            }
                        }
                    }
                    //----------------------------
                    let newTokenMetadata = new TokenMetadataEntity();
                    //----------------------------
                    const image = metadata_raw?.onchain_metadata?.image
                        ? metadata_raw?.onchain_metadata?.image
                        : metadata_raw?.metadata?.logo
                        ? `data:image/png;base64,${metadata_raw?.metadata?.logo}`
                        : undefined;
                    //----------------------------
                    newTokenMetadata.CS = CS;
                    newTokenMetadata.TN_Str = TN_Str;
                    newTokenMetadata.TN_Hex = TN_Hex;
                    newTokenMetadata.ticker = metadata_raw.metadata?.ticker !== undefined ? metadata_raw.metadata?.ticker : TN_Str;
                    newTokenMetadata.decimals = metadata_raw.metadata?.decimals !== undefined ? metadata_raw.metadata?.decimals : TOKEN_DEFAULT_DECIMALS;
                    newTokenMetadata.image = image;
                    newTokenMetadata.colorHex = colorHex;
                    newTokenMetadata.metadata_raw = { ...metadata_raw };
                    newTokenMetadata.swMetadataGenerated = swMetadataGenerated;
                    //----------------------------
                    if (tokenMetadata === undefined) {
                        if (swMetadataFound === true || swCreateMetadataWhenNotFound === true) {
                            newTokenMetadata = await this.create(newTokenMetadata);
                        }
                    } else {
                        if (swMetadataFound === true || swCreateMetadataWhenNotFound === true) {
                            // puede que haya encontrado el token antes, pero que estaba en force refresh
                            newTokenMetadata._DB_id = tokenMetadata._DB_id;
                            await this.update(newTokenMetadata);
                        }
                    }
                    //----------------------------
                    console_log(0, this._Entity.className(), `get_Tokens_Metadata - Metadata fetched: ${showData(newTokenMetadata.metadata_raw)}`);
                    //----------------------------
                    newTokensMetadata.push(newTokenMetadata);
                    //----------------------------
                }
            } else {
                //----------------------------
                console_log(0, this._Entity.className(), `get_Tokens_Metadata - Metadata found - ${showData(tokenMetadata.metadata_raw)}`);
                //----------------------------
                newTokensMetadata.push(tokenMetadata);
                //----------------------------
            }
        }
        //----------------------------
        console_log(-1, this._Entity.className(), `get_Token_Metadata - Metadatas len - ${newTokensMetadata.length} - OK`);
        //----------------------------
        return newTokensMetadata;
    }

    public static async get_Token_MetadataRaw_From_BlockfrostApi(asset_CS: CS, asset_TN: TN): Promise<Record<string, any> | undefined> {
        //----------------------------
        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
            try {
                //----------------------------
                // console.log("getTokenPriceAndMetadataFromMintTransaction: " + log(token))
                //----------------------------
                const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost' + '/assets/' + asset_CS + asset_TN;
                const requestOptions = {
                    method: 'GET',
                    headers: {
                        project_id: 'xxxxx',
                    },
                };
                //----------------------------
                const response = await fetchWrapperBackEnd(urlApi, requestOptions);
                //----------------------------
                switch (response.status) {
                    case 200: {
                        const metadata = await response.json();
                        console_log(0, `Helpers`, `getTokenPriceAndMetadataBlockFrostApi - Metadata: ${toJson(metadata)} - reponse OK`);
                        return metadata;
                    }
                    case 404: {
                        console_log(0, `Helpers`, `getTokenPriceAndMetadataBlockFrostApi - Metadata not found`);
                        return undefined;
                    }
                    default: {
                        const errorData = await response.json();
                        throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
                    }
                }
                //----------------------------
            } catch (error) {
                attempts++;
                console_log(0, `Helpers`, `getTokenPriceAndMetadataBlockFrostApi - Try ${attempts}/${maxAttempts} - Error: ${error}`);
                if (attempts >= maxAttempts) {
                    console_error(0, `Helpers`, `getTokenPriceAndMetadataBlockFrostApi - Error: ${error}`);
                    throw error;
                }
            }
        }
    }

    // #endregion class methods
}

@BackEndApiHandlersFor(TokenMetadataEntity)
export class TokenMetadataBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = TokenMetadataEntity;
    protected static _BackEndApplied = TokenMetadataBackEndApplied;
    // protected static _BackEndMethods = this._BackEndApplied.getBack();

    // #region custom api handlers
    protected static _ApiHandlers: string[] = ['metadata-by-Token', 'metadata-by-Tokens'];

    protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        const { query } = req.query;
        //--------------------
        if (this._ApiHandlers.includes(command) && query !== undefined) {
            if (query[0] === 'metadata-by-Token') {
                req.query = { ...req.query };
                return await this.get_Token_MetadataApiHandler(req, res);
            } else if (query[0] === 'metadata-by-Tokens') {
                req.query = { ...req.query };
                return await this.get_Tokens_MetadataApiHandler(req, res);
            } else {
                console_error(-1, this._Entity.className(), `executeApiHandlers - Error: Api Handler function not found`);
                return res.status(500).json({ error: `Api Handler function not found` });
            }
        } else {
            console_error(-1, this._Entity.className(), `executeApiHandlers - Error: Wrong Custom Api route`);
            return res.status(405).json({ error: `Wrong Custom Api route` });
        }
    }
    // #endregion custom api handlers

    // #region api handlers

    public static async get_Token_MetadataApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //-------------------------
            console_log(1, this._Entity.className(), `get_Token_MetadataApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    CS: yup.string().defined('CS must be a string').strict(true),
                    TN_Hex: yup.string().defined('TN_Hex must be a string').strict(true),
                    forceRefresh: yup.boolean(),
                    swCreateMetadataWhenNotFound: yup.boolean(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `get_Token_MetadataApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { CS, TN_Hex, swCreateMetadataWhenNotFound, forceRefresh } = validatedQuery;
                //-------------------------
                const tokenMetadata: TokenMetadataEntity = await this._BackEndApplied.get_Token_Metadata(CS!, TN_Hex!, forceRefresh, swCreateMetadataWhenNotFound);
                //-------------------------
                console_log(-1, this._Entity.className(), `get_Token_MetadataApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json(tokenMetadata.toPlainObject());
                //-------------------------
            } catch (error) {
                console_error(-1, this._Entity.className(), `get_Token_MetadataApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}` });
            }
        } else if (req.method === 'POST') {
            //-------------------------
            console_log(1, this._Entity.className(), `get_Token_MetadataApiHandler - POST - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    CS: yup.string().defined('CS must be a string').strict(true),
                    TN_Hex: yup.string().defined('TN_Hex must be a string').strict(true),
                    forceRefresh: yup.boolean(),
                    swCreateMetadataWhenNotFound: yup.boolean(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `get_Token_MetadataApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { CS, TN_Hex, forceRefresh, swCreateMetadataWhenNotFound } = validatedQuery;
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape(yupValidateOptionsGet);
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `get_Token_MetadataApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const optionsGet: OptionsGet = { ...validatedBody };
                //-------------------------
                const tokenMetadata: TokenMetadataEntity = await this._BackEndApplied.get_Token_Metadata(CS!, TN_Hex!, forceRefresh, swCreateMetadataWhenNotFound, optionsGet);
                //-------------------------
                console_log(-1, this._Entity.className(), `get_Token_MetadataApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json(tokenMetadata.toPlainObject());
                //-------------------------
            } catch (error) {
                console_error(-1, this._Entity.className(), `get_Token_MetadataApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `get_Token_MetadataApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async get_Tokens_MetadataApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'POST') {
            //-------------------------
            console_log(1, this._Entity.className(), `get_Tokens_MetadataApiHandler - POST - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_log(0, this._Entity.className(), `body: ${showData(req.body)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const tokenSchema = yup.object().shape({
                    CS: yup.string().defined('CS must be a string').strict(true),
                    TN_Hex: yup.string().defined('TN_Hex must be a string').strict(true),
                });
                const schemaBody = yup.object().shape({
                    tokens: yup.array().of(tokenSchema).required('Token array is required'),
                    forceRefresh: yup.boolean(),
                    swCreateMetadataWhenNotFound: yup.boolean(),
                    optionsGet: yup.object().shape(yupValidateOptionsGet),
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `get_Tokens_MetadataApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { tokens, forceRefresh, swCreateMetadataWhenNotFound, optionsGet } = validatedBody;
                //-------------------------
                const tokensMetadata: TokenMetadataEntity[] = await this._BackEndApplied.get_Tokens_MetadataWrapper(tokens, forceRefresh, swCreateMetadataWhenNotFound, optionsGet);
                //-------------------------
                console_log(-1, this._Entity.className(), `get_Tokens_MetadataApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json(tokensMetadata.map((instance) => instance.toPlainObject()));
                //-------------------------
            } catch (error) {
                console_error(-1, this._Entity.className(), `get_Tokens_MetadataApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `get_Tokens_MetadataApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // #endregion api handlers
}
