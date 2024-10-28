import { NextApiResponse } from 'next';
import { console_error, console_log } from '../Commons/BackEnd/globalLogs.js';
import { BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import {
    ADA_DECIMALS,
    CS,
    hexToStr,
    isEmulator,
    isFrontEndEnvironment,
    isToken_CS_And_TN_Valid,
    isTokenADA,
    OptionsGet,
    TN,
    toJson,
    TOKEN_COLOR_ADA,
    TOKEN_COLOR_GENERIC,
    TOKEN_DEFAULT_DECIMALS,
    TOKEN_ICON_ADA,
    TOKEN_ICON_GENERIC,
    yupValidateOptionsGet
} from '../Commons/index.js';
import { yup } from '../Commons/yupLocale.js';
import { TokenMetadataEntity } from '../Entities/Token.Metadata.Entity.js';
import { NextApiRequestAuthenticated } from '../lib/Auth/backEnd.js';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';
import { showData, sanitizeForDatabase, BackEndApiHandlersFor } from '../Commons/index.js';

@BackEndAppliedFor(TokenMetadataEntity)
export class TokenMetadataBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = TokenMetadataEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    public static async get_Token_Metadata(CS: CS, TN_Hex: TN, forceRefresh?: boolean, optionsGet?: OptionsGet): Promise<TokenMetadataEntity> {
        //--------------------------------------
        const tokensMetadata: TokenMetadataEntity[] = await this.get_Tokens_Metadata([{ CS, TN_Hex }], forceRefresh, optionsGet);
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

    public static async get_Tokens_Metadata(tokens: { CS: CS; TN_Hex: TN }[], forceRefresh?: boolean, optionsGet?: OptionsGet): Promise<TokenMetadataEntity[]> {
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
            // return await this.get_Token_MetadataApi(CS, TN_Hex);
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        console_log(1, this._Entity.className(), `get_Tokens_Metadata - Ini`);
        //----------------------------
        // remove duplicates in tokens list
        tokens = tokens.filter((token, index) => tokens.findIndex((token_) => token_.CS === token.CS && token_.TN_Hex === token.TN_Hex) === index);
        //----------------------------
        // Construct the OR condition for batch fetching
        const orConditions = tokens.map((token) => ({ CS: token.CS, TN_Hex: token.TN_Hex }));
        //----------------------------
        // Fetch metadata using OR condition
        let tokensMetadata: TokenMetadataEntity[] = await this.getByParams_({ $or: orConditions }, optionsGet);
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
                const TN_Str = hexToStr(TN_Hex);
                //----------------------------
                let newTokenMetadata = new TokenMetadataEntity();
                //----------------------------
                if (isTokenADA(CS, TN_Hex)) {
                    //----------------------------
                    CS = ''; //CS puede ser lovelace
                    //----------------------------
                    // si es ADA y no lo tengo en la base de datos, lo creo manualmente
                    let metadata_raw: Record<string, any> | undefined;
                    //----------------------------
                    metadata_raw = { onchain_metadata: { image: 'ADA' }, metadata: { decimals: ADA_DECIMALS } };
                    //----------------------------
                    newTokenMetadata.CS = '';
                    newTokenMetadata.TN_Hex = '';
                    newTokenMetadata.TN_Str = '';
                    newTokenMetadata.decimals = metadata_raw.metadata.decimals;
                    newTokenMetadata.image = metadata_raw?.onchain_metadata?.image;
                    newTokenMetadata.colorHex = TOKEN_COLOR_ADA;
                    newTokenMetadata.metadata_raw = { ...metadata_raw };
                    newTokenMetadata.swMetadataGenerated = false; // nunca voy a querer buscar metadatas de ADA nuevamente
                    //----------------------------
                    console_log(0, this._Entity.className(), `get_Tokens_Metadata - Metadata created for ADA token it manually...`);
                    //----------------------------
                    newTokensMetadata.push(newTokenMetadata);
                    //----------------------------
                } else {
                    //----------------------------
                    let metadata_raw: Record<string, any> | undefined;
                    let colorHex: string;
                    let swMetadataGenerated = false;
                    //----------------------------
                    if (isEmulator) {
                        //----------------------------
                        console_log(0, this._Entity.className(), `get_Tokens_Metadata - is Emulator - Creating it manually...`);
                        //----------------------------
                        // const randomIconIndex = Math.floor(Math.random() * TOKEN_ICON_DEMO.length);
                        // const randomIcon = TOKEN_ICON_DEMO[randomIconIndex];
                        // const randomIcon = TOKEN_ICON_GENERIC.toString();
                        //----------------------------
                        // const randomColorIndex = Math.floor(Math.random() * TOKEN_COLOR_DEMO.length);
                        // colorHex = TOKEN_COLOR_DEMO[randomColorIndex];
                        colorHex = TOKEN_COLOR_GENERIC;
                        //----------------------------
                        metadata_raw = { onchain_metadata: { image: '' }, metadata: { decimals: TOKEN_DEFAULT_DECIMALS } };
                        //----------------------------
                        swMetadataGenerated = false; // nunca voy a querer buscar metadatas en emulador nuevamente
                        //----------------------------
                    } else {
                        //----------------------------
                        console_log(0, this._Entity.className(), `get_Tokens_Metadata - Metadata not found - Fetching it from Blockfrost...`);
                        //----------------------------
                        metadata_raw = await this.get_Token_MetadataRaw_From_BlockfrostApi(CS, TN_Hex);
                        //----------------------------
                        // const randomColorIndex = Math.floor(Math.random() * TOKEN_COLOR_DEMO.length);
                        // colorHex = TOKEN_COLOR_DEMO[randomColorIndex];
                        colorHex = TOKEN_COLOR_GENERIC;
                        //----------------------------
                        if (metadata_raw === undefined) {
                            //----------------------------
                            console_log(0, this._Entity.className(), `get_Tokens_Metadata - Metadata not found - Generating random...`);
                            //----------------------------
                            // const randomIconIndex = Math.floor(Math.random() * TOKEN_ICON_DEMO.length);
                            // const randomIcon = TOKEN_ICON_DEMO[randomIconIndex];
                            // const randomIcon = TOKEN_ICON_GENERIC.toString();
                            //----------------------------
                            metadata_raw = { onchain_metadata: { image: '' }, metadata: { decimals: TOKEN_DEFAULT_DECIMALS } };
                            //----------------------------
                            swMetadataGenerated = true; // para intentar buscarla nuevamente en el futuro
                            //----------------------------
                        } else {
                            if (metadata_raw.metadata?.decimals === undefined) {
                                //----------------------------
                                metadata_raw = { ...metadata_raw, metadata: { ...metadata_raw.metadata, decimals: TOKEN_DEFAULT_DECIMALS } };
                                //----------------------------
                                swMetadataGenerated = true; // para intentar buscarla nuevamente en el futuro
                                //----------------------------
                            }
                            if (metadata_raw?.onchain_metadata?.image === undefined || metadata_raw?.metadata?.logo === undefined) {
                                //----------------------------
                                // const randomIconIndex = Math.floor(Math.random() * TOKEN_ICON_DEMO.length);
                                // const randomIcon = TOKEN_ICON_DEMO[randomIconIndex];
                                // const randomIcon = TOKEN_ICON_GENERIC.toString();
                                //----------------------------
                                metadata_raw = { ...metadata_raw, onchain_metadata: { ...metadata_raw.onchain_metadata, image: '' } };
                                //----------------------------
                                swMetadataGenerated = true; // para intentar buscarla nuevamente en el futuro
                                //----------------------------
                            }
                        }
                    }
                    //----------------------------
                    // let newTokenMetadata = new TokenMetadataEntity();
                    //----------------------------
                    const image = metadata_raw?.onchain_metadata?.image
                        ? metadata_raw?.onchain_metadata?.image
                        : metadata_raw?.metadata?.logo
                        ? `data:image/png;base64,${metadata_raw?.metadata?.logo}`
                        : undefined;
                    //----------------------------
                    newTokenMetadata.CS = CS;
                    newTokenMetadata.TN_Hex = TN_Hex;
                    newTokenMetadata.TN_Str = TN_Str;
                    newTokenMetadata.decimals = metadata_raw.metadata?.decimals !== undefined ? metadata_raw.metadata?.decimals : TOKEN_DEFAULT_DECIMALS;
                    newTokenMetadata.image = image;
                    newTokenMetadata.colorHex = colorHex;
                    newTokenMetadata.metadata_raw = { ...metadata_raw };
                    newTokenMetadata.swMetadataGenerated = swMetadataGenerated;
                    //----------------------------
                    console_log(0, this._Entity.className(), `get_Tokens_Metadata - Metadata fetched: ${showData(newTokenMetadata.metadata_raw)}`);
                    //----------------------------
                    newTokensMetadata.push(newTokenMetadata);
                    //----------------------------
                }
                //----------------------------
                if (forceRefresh === true && tokenMetadata !== undefined) {
                    newTokenMetadata._DB_id = tokenMetadata._DB_id;
                    await this.update(newTokenMetadata);
                } else {
                    newTokenMetadata = await this.create(newTokenMetadata);
                }
                //----------------------------
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
        // console.log("getTokenPriceAndMetadataFromMintTransaction: " + log(token))
        //----------------------------
        const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + '/api/blockfrost' + '/assets/' + asset_CS + asset_TN;
        const requestOptions = {
            method: 'GET',
            headers: {
                project_id: 'xxxxx',
            },
        };
        try {
            //----------------------------
            const response = await fetch(urlApi, requestOptions);
            //----------------------------
            switch (response.status) {
                case 200: {
                    const metadata = await response.json();
                    console_log(0, `Helpers`, ` getTokenPriceAndMetadataBlockFrostApi - Metadata: ${toJson(metadata)} - reponse OK`);
                    return metadata;
                }
                case 404: {
                    console_log(0, `Helpers`, ` getTokenPriceAndMetadataBlockFrostApi - Metadata not found`);
                    return undefined;
                }
                default: {
                    const errorData = await response.json();
                    //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                    throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
                }
            }
            //----------------------------
        } catch (error) {
            console_error(0, `Helpers`, ` getTokenPriceAndMetadataBlockFrostApi - Error: ${error}`);
            throw `${error}`;
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
                return await this.get_Token_Metadata_ApiHandler(req, res);
            } else if (query[0] === 'metadata-by-Tokens') {
                req.query = { ...req.query };
                return await this.get_Tokens_Metadata_ApiHandler(req, res);
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

    public static async get_Token_Metadata_ApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //-------------------------
            console_log(1, this._Entity.className(), `get_Token_Metadata_ApiHandler - GET - Init`);
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
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `get_Token_Metadata_ApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { CS, TN_Hex, forceRefresh } = validatedQuery;
                //-------------------------
                const tokenMetadata: TokenMetadataEntity = await this._BackEndApplied.get_Token_Metadata(CS!, TN_Hex!, forceRefresh);
                //-------------------------
                console_log(-1, this._Entity.className(), `get_Token_Metadata_ApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json(tokenMetadata.toPlainObject());
                //-------------------------
            } catch (error) {
                console_error(-1, this._Entity.className(), `get_Token_Metadata_ApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}` });
            }
        } else if (req.method === 'POST') {
            //-------------------------
            console_log(1, this._Entity.className(), `get_Token_Metadata_ApiHandler - POST - Init`);
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
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `get_Token_Metadata_ApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { CS, TN_Hex, forceRefresh } = validatedQuery;
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape(yupValidateOptionsGet);
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `get_Token_Metadata_ApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const optionsGet: OptionsGet = { ...validatedBody };
                //-------------------------
                const tokenMetadata: TokenMetadataEntity = await this._BackEndApplied.get_Token_Metadata(CS!, TN_Hex!, forceRefresh, optionsGet);
                //-------------------------
                console_log(-1, this._Entity.className(), `get_Token_Metadata_ApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json(tokenMetadata.toPlainObject());
                //-------------------------
            } catch (error) {
                console_error(-1, this._Entity.className(), `get_Token_Metadata_ApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `get_Token_Metadata_ApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async get_Tokens_Metadata_ApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'POST') {
            //-------------------------
            console_log(1, this._Entity.className(), `get_Tokens_Metadata_ApiHandler - POST - Init`);
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
                    optionsGet: yup.object().shape(yupValidateOptionsGet),
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `get_Tokens_Metadata_ApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { tokens, forceRefresh, optionsGet } = validatedBody;
                //-------------------------
                const tokensMetadata: TokenMetadataEntity[] = await this._BackEndApplied.get_Tokens_Metadata(tokens, forceRefresh, optionsGet);
                //-------------------------
                console_log(-1, this._Entity.className(), `get_Tokens_Metadata_ApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json(tokensMetadata.map((instance) => instance.toPlainObject()));
                //-------------------------
            } catch (error) {
                console_error(-1, this._Entity.className(), `get_Tokens_Metadata_ApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `get_Tokens_Metadata_ApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // #endregion api handlers
}
