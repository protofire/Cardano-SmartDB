import { NextApiResponse } from 'next';
import { User } from 'next-auth';
import {
    OptionsCreateOrUpdate,
    OptionsDelete,
    OptionsGet,
    OptionsGetOne,
    RegistryManager,
    getCombinedConversionFunctions,
    sanitizeForDatabase,
    showData,
    yupValidateOptionsCreate,
    yupValidateOptionsDelete,
    yupValidateOptionsGet,
    yupValidateOptionsGetOne,
    yupValidateOptionsUpdate,
} from '../../Commons/index.js';
import { console_errorLv2, console_logLv2 } from '../../Commons/BackEnd/globalLogs.js';
import yup from '../../Commons/yupLocale.js';
import { BaseEntity } from '../../Entities/Base/Base.Entity.js';
import { NextApiRequestAuthenticated } from '../../lib/Auth/types.js';
import { BaseBackEndApplied } from './Base.BackEnd.Applied.js';

// #region api swagger

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * tags:
 *   name: Normal Entities
 *   description: Operations related to normal entities (not linked to Blockchain Datums)
 */
/**
 * @swagger
 * /api/{entity}:
 *   post:
 *     summary: Create an entity
 *     tags: [Normal Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               createFields:
 *                 type: object
 *                 description: Fields required to create the entity
 *     responses:
 *       200:
 *         description: Entity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /api/{entity}/update/{id}:
 *   post:
 *     summary: Update an entity by ID
 *     tags: [Normal Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the entity
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updateFields:
 *                 type: object
 *                 description: Fields required to update the entity
 *     responses:
 *       200:
 *         description: Entity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/{entity}/exists/{id}:
 *   get:
 *     summary: Check if an entity exists by ID
 *     tags: [Normal Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the entity
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Entity exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 swExists:
 *                   type: boolean
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/{entity}/exists:
 *   post:
 *     summary: Check if an entity exists by parameters
 *     tags: [Normal Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paramsFilter:
 *                 type: object
 *                 description: Parameters to filter the entity
 *     responses:
 *       200:
 *         description: Entity exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 swExists:
 *                   type: boolean
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/{entity}/{id}:
 *   get:
 *     summary: Get an entity by ID
 *     tags: [Normal Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the entity
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Entity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/{entity}/{id}:
 *   delete:
 *     summary: Delete an entity by ID
 *     tags: [Normal Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the entity
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Entity deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /api/{entity}/all:
 *   get:
 *     summary: Get all entities
 *     tags: [Normal Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Entities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/{entity}/by-params:
 *   post:
 *     summary: Get entities by parameters
 *     tags: [Normal Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paramsFilter:
 *                 type: object
 *                 description: Parameters to filter the entities
 *     responses:
 *       200:
 *         description: Entities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/{entity}/count:
 *   post:
 *     summary: Get the count of entities by parameters
 *     tags: 
 *       - Normal Entities
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paramsFilter:
 *                 type: object
 *                 description: Parameters to filter the entities
 *     responses:
 *       200:
 *         description: Count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /api/{entity}/loadRelationMany/{id}/{relation}:
 *   get:
 *     summary: Load many relations for an entity
 *     tags: [Normal Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the entity
 *       - in: path
 *         name: relation
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the relation
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Relations loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/{entity}/loadRelationMany/{id}/{relation}:
 *   post:
 *     summary: Load many relations for an entity with options
 *     tags: [Normal Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the entity
 *       - in: path
 *         name: relation
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the relation
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               optionsGet:
 *                 type: object
 *                 description: Options to filter the relations
 *     responses:
 *       200:
 *         description: Relations loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/{entity}/loadRelationOne/{id}/{relation}:
 *   get:
 *     summary: Load one relation for an entity
 *     tags: [Normal Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the entity
 *       - in: path
 *         name: relation
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the relation
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Relation loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entity or relation not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/{entity}/loadRelationOne/{id}/{relation}:
 *   post:
 *     summary: Load one relation for an entity with options
 *     tags: [Normal Entities]
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the entity
 *       - in: path
 *         name: relation
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the relation
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               optionsGet:
 *                 type: object
 *                 description: Options to filter the relation
 *     responses:
 *       200:
 *         description: Relation loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entity or relation not found
 *       500:
 *         description: Internal server error
 */
// #endregion api swagger

// Api Handlers siempre llevan una Entity y el backend methods, es especifico para cada entidad
// Se tiene entonces que crear uno por cada Entidad SI o SI

export class BaseBackEndApiHandlers {
    protected static _Entity = BaseEntity;
    protected static _BackEndApplied = BaseBackEndApplied;
    //protected static _BackEndMethods = this._BackEndApplied.getBack();

    // #region custom api handlers
    protected static _ApiHandlers: string[] = [];

    protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        const { query } = req.query;
        //--------------------
        if (this._ApiHandlers.includes(command) && query !== undefined) {
            console_errorLv2(0, this._Entity.className(), `executeApiHandlers - Error: Api Handler function not found`);
            return res.status(500).json({ error: `Api Handler function not found` });
        } else {
            console_errorLv2(0, this._Entity.className(), `executeApiHandlers - Error: Wrong Custom Api route`);
            return res.status(405).json({ error: `Wrong Custom Api route` });
        }
    }
    // #endregion custom api handlers

    // #region restrict api handlers

    public static async restricFilter<T extends BaseEntity>(user: User | undefined) {
        let restricFilter = {};
        return restricFilter;
    }

    public static async restricCreate<T extends BaseEntity>(user: User | undefined) {
        return;
    }

    public static async restricUpdate<T extends BaseEntity>(instance: T, user: User | undefined) {
        return;
    }

    public static async restricDelete<T extends BaseEntity>(instance: T, user: User | undefined) {
        return;
    }

    public static async validateCreateData<T extends BaseEntity>(data: any) {
        const validatedData = data;
        return validatedData;
    }

    public static async validateUpdateData<T extends BaseEntity>(data: any) {
        const validatedData = data;
        return validatedData;
    }

    public static async checkDuplicate<T extends BaseEntity>(validatedData: any, id?: string) {
        console_logLv2(1, this._Entity.className(), `checkDuplicate - Init`);
        //-------------------------
        const conversionFunctions = getCombinedConversionFunctions(this._Entity);
        const query: any = {};
        if (conversionFunctions) {
            for (const [propertyKey, conversions] of conversionFunctions.entries()) {
                if (conversions.isUnique === true) {
                    if (validatedData.hasOwnProperty(propertyKey)) {
                        if (validatedData[propertyKey] !== undefined) {
                            query[propertyKey] = validatedData[propertyKey];
                        }
                    }
                }
            }
            let conditions = Object.keys(query).map((key) => ({ [key]: query[key] }));
            if (conditions.length > 0) {
                //TODO reemplazar con chekIfExist, pero hay que agregar parametro id en el update para no contar a si mismo
                let swExists: boolean = false;
                if (id !== undefined) {
                    console_logLv2(0, this._Entity.className(), `checkDuplicate - To Update - Conditions: ${showData(conditions)}`);
                    swExists = await this._BackEndApplied.checkIfExists_({
                        $and: [{ $or: conditions }, { _id: { $ne: id } }],
                    });
                } else {
                    console_logLv2(0, this._Entity.className(), `checkDuplicate - To Create - Conditions: ${showData(conditions)}`);
                    swExists = await this._BackEndApplied.checkIfExists_({ $or: conditions });
                }
                if (swExists) {
                    const fieldsStr = Object.keys(query).map((key) => key);
                    throw `${this._Entity.className()} already exists with same field(s): ${fieldsStr.join(', ')}`;
                }
            }
        }
        //-------------------------
        console_logLv2(-1, this._Entity.className(), `checkDuplicate - OK`);
        //-------------------------
    }

    // #endregion restrict api handlers

    // #region api handlers

    protected static async mainApiHandlerWithContext<T extends BaseEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------------------------
        const { query } = req.query;
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
    }

    public static async createApiHandlers<T extends BaseEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'POST') {
            console_logLv2(1, this._Entity.className(), `createApiHandlers - POST - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv2(0, this._Entity.className(), `body: ${showData(req.body)}`);
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
                    console_errorLv2(-1, this._Entity.className(), `createApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { createFields } = validatedBody;
                const optionsCreate: OptionsCreateOrUpdate = { ...validatedBody };
                //-------------------------
                const user = req.user;
                await this.restricCreate<T>(user);
                //-------------------------
                let validatedData;
                try {
                    validatedData = await this.validateCreateData<T>(createFields);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `createApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                await this.checkDuplicate<T>(validatedData);
                //-------------------------
                const instance = this._Entity.fromPlainObject<T>(validatedData);
                const instance_ = await this._BackEndApplied.create(instance, optionsCreate);
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `createApiHandlers - POST - OK`);
                //-------------------------
                return res.status(200).json(instance_.toPlainObject());
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `createApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while adding the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_errorLv2(-1, this._Entity.className(), `createApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async updateWithParamsApiHandlers<T extends BaseEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'POST') {
            console_logLv2(1, this._Entity.className(), `updateWithParamsApiHandlers - POST - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv2(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    id: yup.string().required().label(`${this._Entity.className()} ID`),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `updateWithParamsApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { id } = validatedQuery;
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                //TODO: deberia crear dos schemas, uno para updateFields y otro para las OptionGet, para que luego cada uno tenga su propia variable con el contenido adecuado
                // asi me esta generando que options get tenga todos estos parametros
                const schemaBody = yup.object().shape({
                    updateFields: yup.object().required(),
                    ...yupValidateOptionsUpdate,
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `updateWithParamsApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { updateFields } = validatedBody;
                const optionsUpdate: OptionsCreateOrUpdate = { ...validatedBody };
                //-------------------------
                let validatedData;
                try {
                    validatedData = await this.validateUpdateData<T>(updateFields);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `updateWithParamsApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instance = await this._BackEndApplied.getById_<T>(id, { loadRelations: {} }, restricFilter);
                //-------------------------
                if (!instance) {
                    console_errorLv2(-1, this._Entity.className(), `updateWithParamsApiHandlers - Error: ${this._Entity.className()} not found`);
                    return res.status(404).json({ error: `${this._Entity.className()} not found` });
                }
                //-------------------------
                await this.restricUpdate<T>(instance, user);
                //-------------------------
                await this.checkDuplicate<T>(validatedData, instance._DB_id);
                //-------------------------
                await this._BackEndApplied.updateMeWithParams<T>(instance, validatedData, optionsUpdate);
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `updateWithParamsApiHandlers - POST - OK`);
                //-------------------------
                return res.status(200).json(instance.toPlainObject());
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `updateWithParamsApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while updating the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_errorLv2(-1, this._Entity.className(), `updateWithParamsApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async checkIfExistsApiHandlers<T extends BaseEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            console_logLv2(1, this._Entity.className(), `checkIfExistsApiHandlers - GET - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            try {
                //--------------------------------------
                // Assuming your URL is structured like /api/funds/exists/{id}
                // and you're using the catch-all route [[...query]].ts
                const { query } = req.query;
                if (query && query.length > 1) {
                    // Assuming 'exists' is the first segment, and the ID is the second
                    req.query = { id: query[1], ...req.query };
                }
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    id:  yup.string().required().isValidID(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `checkIfExistsApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { id } = validatedQuery;
                //-------------------------
                const swExists = await this._BackEndApplied.checkIfExists_<T>(id);
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `checkIfExistsApiHandlers - POST - OK`);
                //-------------------------
                return res.status(200).json({ swExists });
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `checkIfExistsApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while cheking if exists the ${this._Entity.className()}: ${error}` });
            }
        } else if (req.method === 'POST') {
            console_logLv2(1, this._Entity.className(), `checkIfExistsApiHandlers - POST - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv2(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape({
                    paramsFilter: yup.object(),
                    ...yupValidateOptionsGet,
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `checkIfExistsApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { paramsFilter } = validatedBody;
                //-------------------------
                const swExists = await this._BackEndApplied.checkIfExists_<T>(paramsFilter);
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `checkIfExistsApiHandlers - POST - OK`);
                //-------------------------
                return res.status(200).json({ swExists });
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `checkIfExistsApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while cheking if exists the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_errorLv2(-1, this._Entity.className(), `checkIfExistsApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async getByIdAndDeleteByIdApiHandlers<T extends BaseEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            // se puede recuperar el ducumento completo
            console_logLv2(1, this._Entity.className(), `getByIdApiHandlers - GET - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    id: yup.string().required().label(`${this._Entity.className()} ID`),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `getByIdApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { id } = validatedQuery;
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instance = await this._BackEndApplied.getById_<T>(id, undefined, restricFilter);
                //-------------------------
                if (!instance) {
                    console_errorLv2(-1, this._Entity.className(), `getByIdApiHandlers - Error: ${this._Entity.className()} not found`);
                    return res.status(404).json({ error: `${this._Entity.className()} not found` });
                }
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `getByIdApiHandlers - GET - OK`);
                //-------------------------
                return res.status(200).json(instance.toPlainObject());
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `getByIdApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else if (req.method === 'POST') {
            // se puede recuperar el ducumento y especificar que campos se quieren o no
            console_logLv2(1, this._Entity.className(), `getByIdApiHandlers - POST - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv2(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    id: yup.string().required().label(`${this._Entity.className()} ID`),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `getByIdApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { id } = validatedQuery;
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape(yupValidateOptionsGetOne);
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `getByIdApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const optionsGet: OptionsGetOne = { ...validatedBody };
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instance = await this._BackEndApplied.getById_<T>(id, optionsGet, restricFilter);
                //-------------------------
                if (!instance) {
                    console_errorLv2(-1, this._Entity.className(), `getByIdApiHandlers - Error: ${this._Entity.className()} not found`);
                    return res.status(404).json({ error: `${this._Entity.className()} not found` });
                }
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `getByIdApiHandlers - POST - OK`);
                return res.status(200).json(instance.toPlainObject());
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `getByIdApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else if (req.method === 'DELETE') {
            console_logLv2(1, this._Entity.className(), `deleteByIdApiHandlers - DELETE - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    id: yup.string().required().label(`${this._Entity.className()} ID`),
                    ...yupValidateOptionsDelete,
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `deleteByIdApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { id } = validatedQuery;
                const optionsDelete: OptionsDelete = { ...validatedQuery };
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instance = await this._BackEndApplied.getById_<T>(id, { loadRelations: {} }, restricFilter);
                //-------------------------
                if (!instance) {
                    console_errorLv2(-1, this._Entity.className(), `deleteByIdApiHandlers - Error: ${this._Entity.className()} not found`);
                    return res.status(404).json({ error: `${this._Entity.className()} not found` });
                }
                //-------------------------
                await this.restricDelete<T>(instance, user);
                //-------------------------
                await this._BackEndApplied.delete(instance, optionsDelete);
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `deleteByIdApiHandlers - DELETE - OK`);
                //-------------------------
                return res.status(200).json({ message: `${this._Entity.className()} deleted successfully` });
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `deleteByIdApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while deleting the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_errorLv2(-1, this._Entity.className(), `deleteByIdApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async getByParamsApiHandlers<T extends BaseEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'POST') {
            console_logLv2(1, this._Entity.className(), `getByParamsApiHandlers - POST - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv2(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape({
                    paramsFilter: yup.object(),
                    ...yupValidateOptionsGet,
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `getByParamsApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { paramsFilter } = validatedBody;
                const optionsGet: OptionsGet = { ...validatedBody };
                //-------------------------
                console_logLv2(0, this._Entity.className(), `getByParamsApiHandlers - POST - limit: ${optionsGet.limit} - paramsFilter: ${showData(paramsFilter)}`);
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instances = await this._BackEndApplied.getByParams_<T>(paramsFilter, optionsGet, restricFilter);
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `getByParamsApiHandlers - POST - OK`);
                return res.status(200).json(
                    instances.map((instance) => {
                        //-----------------------
                        const instancePlain = instance.toPlainObject();
                        //-----------------------
                        if (optionsGet !== undefined && optionsGet.lookUpFields !== undefined && optionsGet.lookUpFields.length > 0) {
                            for (let lookUpField of optionsGet.lookUpFields) {
                                const EntityClass =
                                    RegistryManager.getFromSmartDBEntitiesRegistry(lookUpField.from) !== undefined
                                        ? RegistryManager.getFromSmartDBEntitiesRegistry(lookUpField.from)
                                        : RegistryManager.getFromEntitiesRegistry(lookUpField.from);
                                if (EntityClass !== undefined) {
                                    const instancePlain_ = (instance[lookUpField.as as keyof typeof instance] as any).toPlainObject();
                                    if (instancePlain_ !== undefined) {
                                        (instancePlain as any)[lookUpField.as] = instancePlain_;
                                    }
                                }
                            }
                        }
                        return instancePlain;
                        //-----------------------
                    })
                );
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `getByParamsApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_errorLv2(-1, this._Entity.className(), `getByParamsApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async getAllApiHandlers<T extends BaseEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            // get all sin especificar limit, sort ni fieldsForSelect
            console_logLv2(1, this._Entity.className(), `getAllApiHandlers - GET - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            try {
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instances = await this._BackEndApplied.getAll_<T>(undefined, restricFilter);
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `getAllApiHandlers - GET - OK`);
                //-------------------------
                return res.status(200).json(instances.map((instance) => instance.toPlainObject()));
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `getAllApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else if (req.method === 'POST') {
            // get all con limit, sort and fieldsForSelect
            console_logLv2(1, this._Entity.className(), `getAllApiHandlers - POST - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv2(0, this._Entity.className(), `body: ${showData(req.body)}`);
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
                    console_errorLv2(-1, this._Entity.className(), `getAllApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const optionsGet: OptionsGet = { ...validatedBody };
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instances = await this._BackEndApplied.getAll_<T>(optionsGet, restricFilter);
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `getAllApiHandlers - POST - OK`);
                //-------------------------
                return res.status(200).json(instances.map((instance) => instance.toPlainObject()));
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `getAllApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_errorLv2(-1, this._Entity.className(), `getAllApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async getCountApiHandlers<T extends BaseEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'POST') {
            console_logLv2(1, this._Entity.className(), `getCountApiHandlers - POST - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv2(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape({
                    paramsFilter: yup.object(),
                });
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `getCountApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { paramsFilter } = validatedBody;
                //-------------------------
                console_logLv2(0, this._Entity.className(), `getCountApiHandlers - POST - paramsFilter: ${showData(paramsFilter)}`);
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const count = await this._BackEndApplied.getCount_<T>(paramsFilter, restricFilter);
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `getCountApiHandlers - POST - OK`);
                return res.status(200).json({ count: count });
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `getCountApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_errorLv2(-1, this._Entity.className(), `getCountApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async loadRelationManyApiHandlers<T extends BaseEntity, R extends BaseEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            // get all sin especificar limit, sort ni fieldsForSelect
            console_logLv2(1, this._Entity.className(), `loadRelationManyApiHandlers - GET - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    id: yup.string().required().label(`${this._Entity.className()} ID`),
                    relation: yup.string().required().label(`${this._Entity.className()} Relation`),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `loadRelationManyApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { id, relation } = validatedQuery;
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instance = await this._BackEndApplied.getById_<T>(id, { fieldsForSelect: { [relation]: true }, loadRelations: {} }, restricFilter);
                //-------------------------
                if (!instance) {
                    console_errorLv2(-1, this._Entity.className(), `loadRelationManyApiHandlers - Error: ${this._Entity.className()} not found`);
                    return res.status(404).json({ error: `${this._Entity.className()} not found` });
                }
                //-------------------------
                const values: R[] = await this._BackEndApplied.loadRelationMany<T, R>(instance, relation);
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `loadRelationManyApiHandlers - GET - OK`);
                //-------------------------
                return res.status(200).json(values.map((instance) => instance.toPlainObject()));
                //-------------------------
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `loadRelationManyApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()} relation: ${error}` });
            }
        } else if (req.method === 'POST') {
            // get all con limit, sort and fieldsForSelect
            console_logLv2(1, this._Entity.className(), `loadRelationManyApiHandlers - POST - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv2(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    id: yup.string().required().label(`${this._Entity.className()} ID`),
                    relation: yup.string().required().label(`${this._Entity.className()} Relation`),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `loadRelationManyApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { id, relation } = validatedQuery;
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape(yupValidateOptionsGet);
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `loadRelationManyApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const optionsGet: OptionsGet = { ...validatedBody };
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instance = await this._BackEndApplied.getById_<T>(id, { fieldsForSelect: { [relation]: true }, loadRelations: {} }, restricFilter);
                //-------------------------
                if (!instance) {
                    console_errorLv2(-1, this._Entity.className(), `loadRelationManyApiHandlers - Error: ${this._Entity.className()} not found`);
                    return res.status(404).json({ error: `${this._Entity.className()} not found` });
                }
                //-------------------------
                const values: R[] = await this._BackEndApplied.loadRelationMany<T, R>(instance, relation, optionsGet);
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `loadRelationManyApiHandlers - POST - OK`);
                //-------------------------
                return res.status(200).json(values.map((instance) => instance.toPlainObject()));
                //-------------------------
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `loadRelationManyApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()} relation: ${error}` });
            }
        } else {
            console_errorLv2(-1, this._Entity.className(), `loadRelationManyApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async loadRelationOneApiHandlers<T extends BaseEntity, R extends BaseEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            // get all sin especificar limit, sort ni fieldsForSelect
            console_logLv2(1, this._Entity.className(), `loadRelationOneApiHandlers - GET - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    id: yup.string().required().label(`${this._Entity.className()} ID`),
                    relation: yup.string().required().label(`${this._Entity.className()} Relation`),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `loadRelationOneApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { id, relation } = validatedQuery;
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instance = await this._BackEndApplied.getById_<T>(id, { fieldsForSelect: { [relation]: true }, loadRelations: {} }, restricFilter);
                //-------------------------
                if (!instance) {
                    console_errorLv2(-1, this._Entity.className(), `loadRelationOneApiHandlers - Error: ${this._Entity.className()} not found`);
                    return res.status(404).json({ error: `${this._Entity.className()} not found` });
                }
                //-------------------------
                const value: R | undefined = await this._BackEndApplied.loadRelationOne<T, R>(instance, relation);
                //-------------------------
                if (value === undefined) {
                    console_errorLv2(-1, this._Entity.className(), `loadRelationOneApiHandlers - Error: ${this._Entity.className()} relation not found`);
                    return res.status(404).json({ error: `${this._Entity.className()} relation not found` });
                }
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `loadRelationOneApiHandlers - GET - OK`);
                //-------------------------
                return res.status(200).json(value.toPlainObject());
                //-------------------------
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `loadRelationOneApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()} relation: ${error}` });
            }
        } else if (req.method === 'POST') {
            // get all con limit, sort and fieldsForSelect
            console_logLv2(1, this._Entity.className(), `loadRelationOneApiHandlers - POST - Init`);
            console_logLv2(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv2(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    id: yup.string().required().label(`${this._Entity.className()} ID`),
                    relation: yup.string().required().label(`${this._Entity.className()} Relation`),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `loadRelationOneApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { id, relation } = validatedQuery;
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape(yupValidateOptionsGet);
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_errorLv2(-1, this._Entity.className(), `loadRelationOneApiHandlers - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const optionsGet: OptionsGet = { ...validatedBody };
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const instance = await this._BackEndApplied.getById_<T>(id, { fieldsForSelect: { [relation]: true }, loadRelations: {} }, restricFilter);
                //-------------------------
                if (!instance) {
                    console_errorLv2(-1, this._Entity.className(), `loadRelationOneApiHandlers - Error: ${this._Entity.className()} not found`);
                    return res.status(404).json({ error: `${this._Entity.className()} not found` });
                }
                //-------------------------
                const value: R | undefined = await this._BackEndApplied.loadRelationOne<T, R>(instance, relation, optionsGet);
                //-------------------------
                if (value === undefined) {
                    console_errorLv2(-1, this._Entity.className(), `loadRelationOneApiHandlers - Error: ${this._Entity.className()} relation not found`);
                    return res.status(404).json({ error: `${this._Entity.className()} relation not found` });
                }
                //-------------------------
                console_logLv2(-1, this._Entity.className(), `loadRelationOneApiHandlers - POST - OK`);
                //-------------------------
                return res.status(200).json(value.toPlainObject());
                //-------------------------
            } catch (error) {
                console_errorLv2(-1, this._Entity.className(), `loadRelationOneApiHandlers - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()} relation: ${error}` });
            }
        } else {
            console_errorLv2(-1, this._Entity.className(), `loadRelationOneApiHandlers - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // #endregion api handlers
}
