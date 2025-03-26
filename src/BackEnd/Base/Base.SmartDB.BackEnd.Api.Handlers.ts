import { NextApiResponse } from 'next';
import { User } from 'next-auth';
import { globalEmulator } from '../../Commons/BackEnd/globalEmulator.js';
import { console_errorLv1, console_logLv1 } from '../../Commons/BackEnd/globalLogs.js';
import { OptionsCreateOrUpdate, OptionsGet, isEmulator, sanitizeForDatabase, showData, toJson, yupValidateOptionsCreate, yupValidateOptionsGet } from '../../Commons/index.js';
import { yup } from '../../Commons/yupLocale.js';
import { BaseEntity } from '../../Entities/Base/Base.Entity.js';
import { BaseSmartDBEntity } from '../../Entities/Base/Base.SmartDB.Entity.js';
import { NextApiRequestAuthenticated } from '../../lib/Auth/types.js';
import { AddressToFollowBackEndApplied } from '../AddressToFollow.BackEnd.Applied.js';
import { BaseBackEndApiHandlers } from './Base.BackEnd.Api.Handlers.js';
import { BaseSmartDBBackEndApplied } from './Base.SmartDB.BackEnd.Applied.js';
import { JobBackEndApplied } from '../Job.BackEnd.All.js';

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
 *   name: SmartDB Entities
 *   description: Operations related to SmartDB entities (linked with Blockchain Datums)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     QueryParameters:
 *       type: object
 *       description: |
 *         Advanced query object that supports complex filtering with logical operators.
 *
 *         Simple queries:
 *         - Direct field matching: { field: "value" }
 *         - Multiple conditions: { field1: "value1", field2: "value2" }
 *
 *         Advanced queries using operators:
 *         - Comparison: $eq, $ne, $gt, $lt, $gte, $lte
 *         - Array: $in, $nin
 *         - Logical: $and, $or, $not
 *         - Element: $exists
 *         - Regex: $regex
 *
 *         Nested fields are supported using dot notation:
 *         - { "nested.field": "value" }
 *       example:
 *         {
 *           "$and": [
 *             { "name": "John Smith" },
 *             { "age": { "$gt": 25 } },
 *             { "$or": [
 *               { "status": { "$in": ["active", "pending"] } },
 *               { "verified": { "$exists": true } }
 *             ]}
 *           ],
 *           "address.city": { "$regex": "^New" }
 *         }
 *       additionalProperties: true
 */

/**
 * @swagger
 * /api/{smartdb-entity}:
 *   post:
 *     summary: Create a SmartDB entity
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the SmartDB entity
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
 *                 description: Fields required to create the SmartDB entity
 *     responses:
 *       200:
 *         description: SmartDB entity created successfully
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
 * /api/{smartdb-entity}/update/{id}:
 *   post:
 *     summary: Update a SmartDB entity by ID
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
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
 * /api/{smartdb-entity}/exists/{id}:
 *   get:
 *     summary: Check if a SmartDB entity exists by ID
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
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
 * /api/{smartdb-entity}/exists:
 *   post:
 *     summary: Check if a SmartDB entity exists by parameters
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
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
 *                 $ref: '#/components/schemas/QueryParameters'
 *                 description: Optional filtering parameters
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
 * /api/{smartdb-entity}/{id}:
 *   get:
 *     summary: Get a SmartDB entity by ID
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the SmartDB entity
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the SmartDB entity
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: SmartDB entity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: SmartDB entity not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/{smartdb-entity}/{id}:
 *   delete:
 *     summary: Delete a SmartDB entity by ID
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the SmartDB entity
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the SmartDB entity
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: SmartDB entity deleted successfully
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
 *         description: SmartDB entity not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/{smartdb-entity}/all:
 *   get:
 *     summary: Get all SmartDB entities without parameters
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
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
 *
 *   post:
 *     summary: Get all SmartDB entities with pagination, sorting and field selection
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fieldsForSelect:
 *                 type: Record<string, boolean>
 *                 description: Optional - Fields to include/exclude in the response. All values must be consistently either true (inclusion) or false (exclusion)
 *                 example: { "field1": true, "field2": true }
 *               skip:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Number of records to skip
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Maximum number of records to return
 *               sort:
 *                 type: Record<string, 1 | -1>
 *                 description: Optional - Sorting criteria. Keys are field names, values are 1 (ascending) or -1 (descending)
 *                 example: { "fieldName": 1, "otherField": -1 }
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
 *         description: Validation error or invalid parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/{smartdb-entity}/by-params:
 *   post:
 *     summary: Get SmartDB entities by parameters with filtering, pagination, sorting and field selection
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paramsFilter:
 *                 $ref: '#/components/schemas/QueryParameters'
 *                 description: Optional filtering parameters
 *               fieldsForSelect:
 *                 type: Record<string, boolean>
 *                 description: Optional - Fields to include/exclude in the response. All values must be consistently either true (inclusion) or false (exclusion)
 *                 example: { "field1": true, "field2": true }
 *               skip:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Number of records to skip
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Maximum number of records to return
 *               sort:
 *                 type: Record<string, 1 | -1>
 *                 description: Optional - Sorting criteria. Keys are field names, values are 1 (ascending) or -1 (descending)
 *                 example: { "fieldName": 1, "otherField": -1 }
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
 *         description: Validation error or invalid parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/{smartdb-entity}/count:
 *   post:
 *     summary: Get the count of SmartDB entities by parameters
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
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
 *                 $ref: '#/components/schemas/QueryParameters'
 *                 description: Optional filtering parameters
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
 * /api/{smartdb-entity}/loadRelationMany/{id}/{relation}:
 *   get:
 *     summary: Load many relations for a SmartDB entity
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
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
 * /api/{smartdb-entity}/loadRelationMany/{id}/{relation}:
 *   post:
 *     summary: Load many relations for a SmartDB entity with options
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
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
 * /api/{smartdb-entity}/loadRelationOne/{id}/{relation}:
 *   get:
 *     summary: Load one relation for a SmartDB entity
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
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
 * /api/{smartdb-entity}/loadRelationOne/{id}/{relation}:
 *   post:
 *     summary: Load one relation for a SmartDB entity with options
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
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

/**
 * @swagger
 * /api/{smartdb-entity}/deployed:
 *   get:
 *     summary: Get all deployed SmartDB entities
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Deployed entities retrieved successfully
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
 * /api/{smartdb-entity}/deployed:
 *   post:
 *     summary: Get deployed SmartDB entities with options
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
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
 *               optionsGet:
 *                 type: object
 *                 description: Options to filter the entities
 *     responses:
 *       200:
 *         description: Deployed entities retrieved successfully
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
 * /api/{smartdb-entity}/sync/{address}:
 *   get:
 *     summary: Synchronize a SmartDB entity with blockchain data by address
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: The blockchain address to sync
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Entity synchronized successfully
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
 *         description: Address not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/{smartdb-entity}/sync/{address}:
 *   post:
 *     summary: Synchronize a SmartDB entity with blockchain data by address with options
 *     tags: [SmartDB Entities]
 *     parameters:
 *       - in: path
 *         name: smartdb-entity
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the entity
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: The blockchain address to sync
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: Event to sync
 *               force:
 *                 type: boolean
 *                 description: Force sync
 *               tryCountAgain:
 *                 type: boolean
 *                 description: Try sync again
 *     responses:
 *       200:
 *         description: Entity synchronized successfully
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
 *         description: Address not found
 *       500:
 *         description: Internal server error
 */

// #endregion api swagger

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
            // name: yup.string().required().label(`${this._Entity.className()} Name`),
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
            //name: yup.string().required().label(`${this._Entity.className()} Name`),
        });
        //-------------------
        validatedData = await formSchema.validate(validatedData, { stripUnknown: false });
        //-------------------
        return validatedData;
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
        } else if (query[0] === 'deployed') {
            return this.getDeployedApiHandlers(req, res);
        } else if (query[0] === 'sync') {
            if (query.length === 3) {
                req.query = { address: query[1], CS: query[2] };
            } else {
                req.query = {};
            }
            return await this.syncWithAddressApiHandlers(req, res);
        } else if (query[0] === 'parse-blockchain-address') {
            return await this.parseBlockchainAddressApiHandler(req, res);
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
            console_logLv1(1, this._Entity.className(), `getDeployedApiHandlers - POST - Init`);
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
                    CS: yup.string().required(),
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
                const { address, CS }: { address: string; CS: string } = validatedQuery;
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
                const LucidToolsBackEnd = (await import('../../lib/Lucid/backEnd.js')).LucidToolsBackEnd;
                var { lucid } = await LucidToolsBackEnd.prepareLucidBackEndForTx(undefined);
                //--------------------------------------
                console_logLv1(0, this._Entity.className(), `syncWithAddressApiHandlers - address: ${address} - CS: ${CS} - event: ${showData(event)}`);
                //--------------------------------------
                const addressesToFollow = await AddressToFollowBackEndApplied.getByAddress(address, CS);
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
                    CS: yup.string().required(),
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
                const { address, CS }: { address: string; CS: string } = validatedQuery;
                //--------------------------------------
                if (isEmulator) {
                    // solo en emulator. Me aseguro de setear el emulador al tiempo real del server. Va a saltear los slots necesarios.
                    // const TimeBackEnd = (await import('../../../Time/backEnd')).TimeBackEnd;
                    // await TimeBackEnd.syncBlockChainWithServerTime();
                }
                //--------------------------------------
                const LucidToolsBackEnd = (await import('../../lib/Lucid/backEnd.js')).LucidToolsBackEnd;
                var { lucid } = await LucidToolsBackEnd.prepareLucidBackEndForTx(undefined);
                //--------------------------------------
                console_logLv1(0, this._Entity.className(), `syncWithAddressApiHandlers - address: ${address} - CS: ${CS}`);
                //--------------------------------------
                const addressesToFollow = await AddressToFollowBackEndApplied.getByAddress(address, CS);
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

    public static async parseBlockchainAddressApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'POST') {
            console_logLv1(1, this._Entity.className(), `parseBlockchainAddressApiHandler - POST - Init`);
            console_logLv1(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_logLv1(0, this._Entity.className(), `body: ${showData(req.body)}`);
            //-------------------------
            try {
                //-------------------------
                const schemaBody = yup.object().shape({
                    address: yup.string().required(),
                    datumType: yup.string().required(),
                    fromBlock: yup.number(),
                    toBlock: yup.number(),
                });
                //--------------------------------------
                const validatedBody = await schemaBody.validate(req.body);
                //--------------------------------------
                const { address, datumType, fromBlock, toBlock } = validatedBody;
                //-------------------------
                // Generate a unique job ID
                // const jobId = `job-${Date.now()}`;
                const jobId = `job-parse-blockchain`;
                //--------------------------------------
                const job = await JobBackEndApplied.getJob(jobId);
                //--------------------------------------
                if (job !== undefined) {
                    if (job.status === 'running') {
                        return res.status(400).json({ error: `Job already exists` });
                    }
                }
                //--------------------------------------
                // Start job with 'pending' status
                await JobBackEndApplied.startJob(jobId, 'Starting parsing process...');
                //-------------------------
                // Asynchronously start parsing process
                //-------------------------
                setImmediate(async () => {
                    try {
                        await JobBackEndApplied.updateJob(jobId, 'running', undefined, undefined, `Starting...`);
                        const result = await this._BackEndApplied.parseBlockchainAddress_(jobId, address, datumType, fromBlock, toBlock);
                        await JobBackEndApplied.updateJob(jobId, 'completed', result, undefined, `Completed`);
                    } catch (error) {
                        await JobBackEndApplied.updateJob(jobId, 'failed', false, toJson(error));
                    }
                });
                //-------------------------
                console_logLv1(-1, this._Entity.className(), `parseBlockchainAddressApiHandler - jobId: ${jobId} - POST - OK`);
                //-------------------------
                // Return the job ID to the client
                return res.status(202).json({ jobId });
                //-------------------------
            } catch (error) {
                console_errorLv1(-1, this._Entity.className(), `parseBlockchainAddressApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while parsing the blockchain: ${error}` });
            }
        } else {
            console_errorLv1(-1, this._Entity.className(), `parseBlockchainAddressApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // #endregion api handlers
}
