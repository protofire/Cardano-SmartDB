import { NextApiRequestAuthenticated } from '@/src/lib/SmartDB/lib/Auth/index';
import { hexToStr, isFrontEndEnvironment, showData, sanitizeForDatabase, toJson } from '@/src/utils/commons/utils';
import yup from '@/src/utils/commons/yupLocale';
import { ADA_DECIMALS, TOKEN_DEFAULT_DECIMALS, TOKEN_MAYZ_DECIMALS, isEmulator } from '@/src/utils/specific/constants';
import { TOKEN_COLOR_ADA, TOKEN_COLOR_DEMO, TOKEN_COLOR_MAYZ, TOKEN_COLOR_SYSTEM, TOKEN_ICON_DEMO, TOKEN_ICON_MAYZ, TOKEN_ICON_SYSTEM } from '@/src/utils/specific/images';
import { NextApiResponse } from 'next';
import { CS, OptionsGet, TN, checkIfIsMAYZToken, checkIfIsSystemToken, isTokenADA, isToken_CS_And_TN_Valid, yupValidateOptionsGet } from '../Commons';
import { BackEndAppliedFor } from '../Commons/Decorator.BackEndAppliedFor';
import { console_error, console_log, tabs } from '../Commons/BackEnd/globalLogs';
import { TokenMetadataEntity } from '../Entities/Token.Metadata.Entity';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods';

@BackEndAppliedFor(TokenMetadataEntity)
export class TokenMetadataBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = TokenMetadataEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    public static async get_Token_Metadata(CS: CS, TN_Hex: TN, forceRefresh?: boolean, optionsGet?: OptionsGet): Promise<TokenMetadataEntity> {
        //----------------------------
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
            // return await this.get_Token_MetadataApi(CS, TN_Hex);
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        const TN_Str = hexToStr(TN_Hex);
        //----------------------------
        const isSystemToken = checkIfIsSystemToken(CS, TN_Hex);
        const isMAYZToken = checkIfIsMAYZToken(CS, TN_Hex);
        //----------------------------
        console_log(1, this._Entity.className(), `get_Token_Metadata - Init - CS: ${CS} - TN: ${hexToStr(TN_Hex)} - isADA: ${isADA}`);
        //----------------------------
        let tokenMetadata: TokenMetadataEntity | undefined = await this.getOneByParams_({ CS, TN_Hex }, optionsGet);
        // cuando lo leo, estoy usando el option get, pero cuando lo creo y pido de blockfrost, luego estoy regresandolo completo
        // no es problema, por que va a suceder una sola vez, el resto de las veces deberia levantar solo los campos que pido
        // lo uso para no recibir metadata_raw
        //----------------------------
        if (tokenMetadata === undefined || forceRefresh === true) {
            //----------------------------
            if (isADA) {
                // si es ADA y no lo tengo en la base de datos, lo creo manualmente
                let metadata_raw: Record<string, any> | undefined;
                //----------------------------
                metadata_raw = { onchain_metadata: { image: '/img/tokens/ada.png' }, metadata: { decimals: ADA_DECIMALS } };
                //----------------------------
                let newTokenMetadata = new TokenMetadataEntity();
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
                if (forceRefresh === true && tokenMetadata !== undefined) {
                    newTokenMetadata._DB_id = tokenMetadata._DB_id;
                    await this.update(newTokenMetadata);
                } else {
                    newTokenMetadata = await this.create(newTokenMetadata);
                }
                //----------------------------
                console_log(0, this._Entity.className(), `get_Token_Metadata - Metadata created for ADA token it manually...`);
                //----------------------------
                return newTokenMetadata;
            } else {
                //----------------------------
                let metadata_raw: Record<string, any> | undefined;
                let colorHex: string;
                let swMetadataGenerated = false;
                //----------------------------
                if (isSystemToken) {
                    //----------------------------
                    console_log(0, this._Entity.className(), `get_Token_Metadata - Is System Token - Creating it manually...`);
                    //----------------------------
                    metadata_raw = { onchain_metadata: { image: TOKEN_ICON_SYSTEM }, metadata: { decimals: 0 } };
                    //----------------------------
                    colorHex = TOKEN_COLOR_SYSTEM;
                    //----------------------------
                    swMetadataGenerated = false; // nunca voy a querer buscar metadatas de system tokens nuevamente
                    //----------------------------
                } else if (isMAYZToken) {
                    //----------------------------
                    console_log(0, this._Entity.className(), `get_Token_Metadata - Is MAYZ Token - Creating it manually...`);
                    //----------------------------
                    metadata_raw = { onchain_metadata: { image: TOKEN_ICON_MAYZ }, metadata: { decimals: TOKEN_MAYZ_DECIMALS } };
                    //----------------------------
                    colorHex = TOKEN_COLOR_MAYZ;
                    //----------------------------
                    swMetadataGenerated = false; // nunca voy a querer buscar metadatas de MAYZ nuevamente
                    //----------------------------
                } else if (isEmulator) {
                    //----------------------------
                    console_log(0, this._Entity.className(), `get_Token_Metadata - is Emulator - Creating it manually...`);
                    //----------------------------
                    const randomIconIndex = Math.floor(Math.random() * TOKEN_ICON_DEMO.length);
                    const randomIcon = TOKEN_ICON_DEMO[randomIconIndex];
                    //----------------------------
                    const randomColorIndex = Math.floor(Math.random() * TOKEN_COLOR_DEMO.length);
                    colorHex = TOKEN_COLOR_DEMO[randomColorIndex];
                    //----------------------------
                    metadata_raw = { onchain_metadata: { image: randomIcon }, metadata: { decimals: TOKEN_DEFAULT_DECIMALS } };
                    //----------------------------
                    swMetadataGenerated = false; // nunca voy a querer buscar metadatas en emulador nuevamente
                    //----------------------------
                } else {
                    //----------------------------
                    console_log(0, this._Entity.className(), `get_Token_Metadata - Metadata not found - Fetching it from Blockfrost...`);
                    //----------------------------
                    metadata_raw = await this.get_Token_MetadataRaw_From_BlockfrostApi(CS, TN_Hex);
                    //----------------------------
                    const randomColorIndex = Math.floor(Math.random() * TOKEN_COLOR_DEMO.length);
                    colorHex = TOKEN_COLOR_DEMO[randomColorIndex];
                    //----------------------------
                    if (metadata_raw === undefined) {
                        //----------------------------
                        console_log(0, this._Entity.className(), `get_Token_Metadata - Metadata not found - Generating random...`);
                        //----------------------------
                        const randomIconIndex = Math.floor(Math.random() * TOKEN_ICON_DEMO.length);
                        const randomIcon = TOKEN_ICON_DEMO[randomIconIndex];
                        //----------------------------
                        metadata_raw = { onchain_metadata: { image: randomIcon }, metadata: { decimals: TOKEN_DEFAULT_DECIMALS } };
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
                            const randomIconIndex = Math.floor(Math.random() * TOKEN_ICON_DEMO.length);
                            const randomIcon = TOKEN_ICON_DEMO[randomIconIndex];
                            //----------------------------
                            metadata_raw = { ...metadata_raw, onchain_metadata: { ...metadata_raw.onchain_metadata, image: randomIcon } };
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
                newTokenMetadata.TN_Hex = TN_Hex;
                newTokenMetadata.TN_Str = TN_Str;
                newTokenMetadata.decimals = metadata_raw.metadata?.decimals !== undefined ? metadata_raw.metadata?.decimals : TOKEN_DEFAULT_DECIMALS;
                newTokenMetadata.image = image;
                newTokenMetadata.colorHex = colorHex;
                newTokenMetadata.metadata_raw = { ...metadata_raw };
                newTokenMetadata.swMetadataGenerated = swMetadataGenerated;
                //----------------------------
                if (forceRefresh === true && tokenMetadata !== undefined) {
                    newTokenMetadata._DB_id = tokenMetadata._DB_id;
                    await this.update(newTokenMetadata);
                } else {
                    newTokenMetadata = await this.create(newTokenMetadata);
                }
                //----------------------------
                console_log(-1, this._Entity.className(), `get_Token_Metadata - Metadata fetched: ${showData(newTokenMetadata.metadata_raw)} - OK`);
                return newTokenMetadata;
            }
        } else {
            //----------------------------
            console_log(-1, this._Entity.className(), `get_Token_Metadata - Metadata found - ${showData(tokenMetadata.metadata_raw)} - OK`);
            return tokenMetadata;
            //----------------------------
        }
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

export class TokenMetadataBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = TokenMetadataEntity;
    protected static _BackEndApplied = TokenMetadataBackEndApplied;
    // protected static _BackEndMethods = this._BackEndApplied.getBack();

    // #region custom api handlers
    protected static _ApiHandlers: string[] = ['metadata-by-Token'];

    protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        const { query } = req.query;
        //--------------------
        if (this._ApiHandlers.includes(command) && query !== undefined) {
            if (query[0] === 'metadata-by-Token') {
                req.query = { ...req.query };
                return await this.get_Token_Metadata_ApiHandler(req, res);
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
                    CS: yup.string(),
                    TN: yup.string(),
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
                const { CS, TN, forceRefresh } = validatedQuery;
                //-------------------------
                const tokenMetadata: TokenMetadataEntity = await this._BackEndApplied.get_Token_Metadata(CS!, TN!, forceRefresh);
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
                    CS: yup.string(),
                    TN: yup.string(),
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
                const { CS, TN, forceRefresh } = validatedQuery;
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape(yupValidateOptionsGet);
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `getByAdminApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const optionsGet: OptionsGet = { ...validatedBody };
                //-------------------------
                const tokenMetadata: TokenMetadataEntity = await this._BackEndApplied.get_Token_Metadata(CS!, TN!, forceRefresh, optionsGet);
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

    // #endregion api handlers
}
