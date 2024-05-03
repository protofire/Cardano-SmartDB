import { NextApiResponse } from 'next';
import { OptionsCreateOrUpdate, OptionsGet, isEmulator, sanitizeForDatabase, showData, yupValidateOptionsCreate, yupValidateOptionsGet } from '../../Commons';
import { globalEmulator } from '../../Commons/BackEnd/globalEmulator';
import { console_errorLv1, console_logLv1, initApiRequestWithContext } from '../../Commons/index.BackEnd';
import { BaseEntity } from '../../Entities/Base/Base.Entity';
import { BaseSmartDBEntity } from '../../Entities/Base/Base.SmartDB.Entity';
import { NextApiRequestAuthenticated } from '../../lib/Auth/types';
import { AddressToFollowBackEndApplied } from '../AddressToFollow.BackEnd.Applied';
import { BaseBackEndApiHandlers } from './Base.BackEnd.Api.Handlers';
import { BaseSmartDBBackEndApplied } from './Base.SmartDB.BackEnd.Applied';
import { User } from 'next-auth';
import yup from '../../Commons/yupLocale';

// Api Handlers siempre llevan una Entity y el backend methods, es especifico para cada entidad
// Se tiene entonces que crear uno por cada Entidad SI o SI

export class BaseSmartDBBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = BaseSmartDBEntity;
    protected static _BackEndApplied = BaseSmartDBBackEndApplied;
    //protected static _BackEndMethods = this._BackEndApplied.getBack();

    // #region internal class methods

    // #endregion internal class methods

    // #region restrict api handlers

    public static async restricFilter<T extends BaseEntity>(user: User | undefined) {
        //----------------------------
        console_logLv1(1, this._Entity.className(), `restricFilter - Init`);
        //----------------------------
        let restricFilter: any = await super.restricFilter(user);
        //-------------------
        if (user === undefined || user.isWalletValidatedWithSignedToken === false) {
            restricFilter = { $or: [{ _isDeployed: true }] };
        } else {
            restricFilter = { $or: [{ _isDeployed: true }, { _creator: user.pkh }] };
        }
        //----------------------------
        console_logLv1(-1, this._Entity.className(), `restricFilter - OK`);
        //----------------------------
        return restricFilter;
        //-------------------
    }

    public static async restricCreate<T extends BaseEntity>(user: User | undefined) {
        //-------------------
        if (user === undefined) {
            throw `Can't create ${this._Entity.className()} if not logged`;
        }
        //-------------------
        if (user.isWalletValidatedWithSignedToken === false) {
            throw `Can't create ${this._Entity.className()} if not logged in Admin Mode`;
        }
        //-------------------
    }

    public static async restricUpdate<T extends BaseEntity>(instance: T, user: User | undefined) {
        //-------------------
        if (user === undefined) {
            throw `Can't update ${this._Entity.className()} if not logged`;
        }
        //-------------------
        if (user.isWalletValidatedWithSignedToken === false) {
            throw `Can't update ${this._Entity.className()} if not logged in Admin Mode`;
        }
        //-------------------
        const instanceSmartDB = instance as unknown as BaseSmartDBEntity;
        //-------------------
        if (!instanceSmartDB.isCreator(user.pkh)) {
            throw `Can't update ${this._Entity.className()} if not creator`;
        }
        //-------------------
    }

    public static async restricDelete<T extends BaseEntity>(instance: T, user: User | undefined) {
        //-------------------
        if (user === undefined) {
            throw `Can't delete ${this._Entity.className()} if not logged`;
        }
        //-------------------
        if (user.isWalletValidatedWithSignedToken === false) {
            throw `Can't delete ${this._Entity.className()} if not logged in Admin Mode`;
        }
        //-------------------
        const instanceSmartDB = instance as unknown as BaseSmartDBEntity;
        //-------------------
        if (instanceSmartDB._isDeployed === true) {
            throw `Can't delete deployed ${this._Entity.className()}`;
        }
        //-------------------
        if (!instanceSmartDB.isCreator(user.pkh)) {
            throw `Can't delete ${this._Entity.className()} if not creator`;
        }
        //-------------------
    }

    public static async validateCreateData<T extends BaseEntity>(data: any): Promise<any> {
        let validatedData = await super.validateCreateData(data);
        //-------------------
        let formSchema = yup.object().shape({
            name: yup.string().required().label(`${this._Entity.className()} Name`),
            _NET_address: yup.string().label(`${this._Entity.className()} Network Address`),
        });
        //-------------------
        validatedData = await formSchema.validate(validatedData, { stripUnknown: false });
        //-------------------
        return validatedData;
    }

    public static async validateUpdateData<T extends BaseEntity>(data: any): Promise<any> {
        let validatedData = await super.validateUpdateData(data);
        //-------------------
        let formSchema = yup.object().shape({
            name: yup.string().required().label(`${this._Entity.className()} Name`),
        });
        //-------------------
        validatedData = await formSchema.validate(validatedData, { stripUnknown: false });
        //-------------------
        return validatedData;
    }

    // #endregion restrict api handlers

    // #region api handlers

    public static async mainApiHandler<T extends BaseEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        return await initApiRequestWithContext(1, this._Entity.className(), req, res, this.mainApiHandlerWithContext.bind(this));
    }

    protected static async mainApiHandlerWithContext<T extends BaseEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------------------------
        const { query } = req.query;
        //--------------------
        const AuthBackEnd = (await import('../../lib/Auth/Auth.BackEnd')).AuthBackEnd;
        //--------------------------------------
        try {
            await AuthBackEnd.addCorsHeaders(req, res);
        } catch (error) {
            console_errorLv1(0, this._Entity.className(), `Api handler - Error: ${error}`);
            return res.status(500).json({ error: `An error occurred while adding Cors Headers - Error: ${error}` });
        }
        //--------------------
        try {
            await AuthBackEnd.authenticate(req, res);
        } catch (error) {
            console_errorLv1(0, this._Entity.className(), `Api handler - Error: ${error}`);
            return res.status(401).json({ error: 'Unauthorized' });
        }

        //--------------------
        if (query === undefined || query.length === 0) {
            return await this.createApiHandlers(req, res);
        } else if (query[0] === 'all') {
            return await this.getAllApiHandlers(req, res);
        } else if (query[0] === 'by-params') {
            return await this.getByParamsApiHandlers(req, res);
        } else if (query[0] === 'count') {
            return await this.getCountApiHandlers(req, res);
        } else if (query[0] === 'exists') {
            return await this.checkIfExistsApiHandlers(req, res);
        } else if (query[0] === 'update') {
            if (query.length === 2) {
                req.query = { id: query[1] };
            } else {
                req.query = {};
            }
            return await this.updateWithParamsApiHandlers(req, res);
        } else if (query[0] === 'deployed') {
            return this.getDeployedApiHandlers(req, res);
        } else if (query[0] === 'sync') {
            if (query.length === 2) {
                req.query = { address: query[1] };
            } else {
                req.query = {};
            }
            return await this.syncWithAddressApiHandlers(req, res);
        } else if (query[0] === 'loadRelationMany') {
            if (query.length === 3) {
                req.query = { id: query[1], relation: query[2] };
            } else {
                req.query = {};
            }
            return await this.loadRelationManyApiHandlers(req, res);
        } else if (query[0] === 'loadRelationOne') {
            if (query.length === 3) {
                req.query = { id: query[1], relation: query[2] };
            } else {
                req.query = {};
            }
            return await this.loadRelationOneApiHandlers(req, res);
        } else if (this._ApiHandlers.includes(query[0])) {
            return await this.executeApiHandlers(query[0], req, res);
        } else {
            req.query = { id: query[0], ...req.query };
            return await this.getByIdAndDeleteByIdApiHandlers(req, res);
        }
        // };
        // runAsync().catch((error) => {
        //     console_errorLv1(0, this._Entity.className(), `Api handler - Error: ${error}`);
        //     return res.status(500).json({ error: `An error occurred while processing the request: ${error}` });
        // });
    }

    public static async createApiHandlers<T extends BaseSmartDBEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'POST') {
            console_logLv1(1, this._Entity.className(), `createApiHandlers - POST - Init`);
            console_logLv1(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv1(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape({
                    createFields: yup.object().required(),
                    ...yupValidateOptionsCreate,
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_errorLv1(-1, this._Entity.className(), `createApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { createFields } = validatedBody;
                const optionsCreate: OptionsCreateOrUpdate = { ...validatedBody };
                //-------------------------
                const user = req.user;
                await this.restricCreate(user);
                //-------------------------
                let validatedData;
                try {
                    validatedData = await this.validateCreateData<T>(createFields);
                } catch (error) {
                    console_errorLv1(-1, this._Entity.className(), `createApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                await this.checkDuplicate<T>(validatedData);
                //-------------------------
                const instance = this._Entity.fromPlainObject<T>(validatedData);
                instance._creator = user!.pkh;
                const instance_ = await this._BackEndApplied.create(instance, optionsCreate);
                //-------------------------
                console_logLv1(-1, this._Entity.className(), `createApiHandlers - POST - OK`);
                //-------------------------
                return res.status(200).json(instance_.toPlainObject());
            } catch (error) {
                console_errorLv1(-1, this._Entity.className(), `createApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while adding the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_errorLv1(-1, this._Entity.className(), `createApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async getDeployedApiHandlers<T extends BaseSmartDBEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            // get deployed sin especificar limit, sort ni fieldsForSelect
            console_logLv1(1, this._Entity.className(), `getDeployedApiHandlers - GET - Init`);
            console_logLv1(0, this._Entity.className(), `query: ${showData(req.query)}`);
            try {
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instances = await this._BackEndApplied.getDeployed_<T>(undefined, restricFilter);
                //-------------------------
                console_logLv1(-1, this._Entity.className(), `getDeployedApiHandlers - GET - OK`);
                //-------------------------
                return res.status(200).json(instances.map((instance) => instance.toPlainObject()));
            } catch (error) {
                console_errorLv1(-1, this._Entity.className(), `getDeployedApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else if (req.method === 'POST') {
            // get deployed con limit, sort and fieldsForSelect
            console_logLv1(1, this._Entity.className(), `getDeployedApiHandlers - GET - Init`);
            console_logLv1(0, this._Entity.className(), `query: ${showData(req.query)}`);
            try {
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape(yupValidateOptionsGet);
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_errorLv1(-1, this._Entity.className(), `getDeployedApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const optionsGet: OptionsGet = { ...validatedBody };
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instances = await this._BackEndApplied.getDeployed_<T>(optionsGet, restricFilter);
                //-------------------------
                console_logLv1(-1, this._Entity.className(), `getDeployedApiHandlers - GET - OK`);
                //-------------------------
                return res.status(200).json(instances.map((instance) => instance.toPlainObject()));
            } catch (error) {
                console_errorLv1(-1, this._Entity.className(), `getDeployedApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_errorLv1(-1, this._Entity.className(), `getDeployedApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async syncWithAddressApiHandlers<T extends BaseSmartDBEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        // puede ser GET O POST, algunos servicios usan unos y otros otros. Internamente uso el POST
        if (req.method === 'POST') {
            console_logLv1(1, this._Entity.className(), `syncWithAddressApiHandlers - POST - Init`);
            console_logLv1(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv1(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    address: yup.string().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_errorLv1(-1, this._Entity.className(), `syncWithAddressApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { address }: { address: string } = validatedQuery;
                //--------------------------------------
                const schemaBody = yup.object().shape({
                    event: yup.string().label('Event'),
                    force: yup.boolean().label('Force Sync'),
                    tryCountAgain: yup.boolean().label('Try Again'),
                });
                const validatedBody = await schemaBody.validate(req.body);
                //--------------------------------------
                const { event, force, tryCountAgain }: { event?: string; force?: boolean; tryCountAgain?: boolean } = validatedBody;
                //--------------------------------------
                if (isEmulator) {
                    // solo en emulator. Me aseguro de setear el emulador al tiempo real del server. Va a saltear los slots necesarios.
                    // const TimeBackEnd = (await import('../../../Time/backEnd')).TimeBackEnd;
                    // await TimeBackEnd.syncBlockChainWithServerTime();
                }
                //--------------------------------------
                const LucidToolsBackEnd = (await import('../../lib/Lucid/backEnd')).LucidToolsBackEnd;
                var { lucid } = await LucidToolsBackEnd.prepareLucidBackEndForTx(undefined);
                //--------------------------------------
                console_logLv1(0, this._Entity.className(), `syncWithAddressApiHandlers - address: ${address} - event: ${showData(event)}`);
                //--------------------------------------
                const addressesToFollow = await AddressToFollowBackEndApplied.getByAddress(address);
                if (addressesToFollow.length > 0) {
                    //--------------------------------------
                    if (isEmulator === true && globalEmulator.emulatorDB === undefined) {
                        throw `globalEmulator emulatorDB current not found`;
                    }
                    //--------------------------------------
                    //TODO y si hay mas de una en la misma address?
                    const addressToFollow = addressesToFollow[0];
                    //--------------------------------------
                    await this._BackEndApplied.syncWithAddress_<T>(lucid, globalEmulator.emulatorDB, addressToFollow, force, tryCountAgain);
                }
                //--------------------------------------
                console_logLv1(-1, this._Entity.className(), `syncWithAddressApiHandlers - POST - OK`);
                //--------------------------------------
                return res.status(200).json({ message: `${this._Entity.className()} successfully synchronized` });
            } catch (error) {
                console_errorLv1(-1, this._Entity.className(), `syncWithAddressApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while synchronizing the ${this._Entity.className()}: ${error}` });
            }
        } else if (req.method === 'GET') {
            console_logLv1(1, this._Entity.className(), `syncWithAddressApiHandlers - GET - Init`);
            console_logLv1(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv1(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    address: yup.string().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_errorLv1(-1, this._Entity.className(), `syncWithAddressApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { address }: { address: string } = validatedQuery;
                //--------------------------------------
                if (isEmulator) {
                    // solo en emulator. Me aseguro de setear el emulador al tiempo real del server. Va a saltear los slots necesarios.
                    // const TimeBackEnd = (await import('../../../Time/backEnd')).TimeBackEnd;
                    // await TimeBackEnd.syncBlockChainWithServerTime();
                }
                //--------------------------------------
                const LucidToolsBackEnd = (await import('../../lib/Lucid/backEnd')).LucidToolsBackEnd;
                var { lucid } = await LucidToolsBackEnd.prepareLucidBackEndForTx(undefined);
                //--------------------------------------
                console_logLv1(0, this._Entity.className(), `syncWithAddressApiHandlers - address: ${address}`);
                //--------------------------------------
                const addressesToFollow = await AddressToFollowBackEndApplied.getByAddress(address);
                if (addressesToFollow.length > 0) {
                    //--------------------------------------
                    if (isEmulator === true && globalEmulator.emulatorDB === undefined) {
                        throw `globalEmulator emulatorDB current not found`;
                    }
                    //--------------------------------------
                    //TODO y si hay mas de una en la misma address?
                    const addressToFollow = addressesToFollow[0];
                    await this._BackEndApplied.syncWithAddress_<T>(lucid, globalEmulator.emulatorDB, addressToFollow, false);
                }
                //--------------------------------------
                console_logLv1(-1, this._Entity.className(), `syncWithAddressApiHandlers - GET - OK`);
                //--------------------------------------
                return res.status(200).json({ message: `${this._Entity.className()} successfully synchronized` });
            } catch (error) {
                console_errorLv1(-1, this._Entity.className(), `syncWithAddressApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while synchronizing the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_errorLv1(-1, this._Entity.className(), `syncWithAddressApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // #endregion api handlers
}
