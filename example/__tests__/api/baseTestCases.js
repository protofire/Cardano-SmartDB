const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const myEnv = dotenv.config({ path: './.env' });
dotenvExpand.expand(myEnv);

const { object, string, array, number, oneOf } = require('yup');
const request = require('supertest');
const crypto = require('crypto'); // Add the crypto

const baseURL = 'http://localhost:3000'; // Change the port if your server runs on a different port

// NOTE: Valid token must be provided in order to try all tests rutes!
const validToken = process.env.AUTH_TOKEN;
const invalidToken = 'invalidToken';

const validEntity = 'test';
const invalidEntity = 'invalidEntity';

const invalidEntityId = 'invalidEntityId'; // You can keep this as a constant

const validEntityId = 'validEntityId'; //NOTE: will be populated with a valid ID
const validNonExistsEntityId = 'validNonExistsEntityId'; //NOTE: will be populated with a non-existing ID

const validBodyWithParamsFilter = 'validBodyWithParamsFilter'; //NOTE: will be populated with a valid body
const validBodyWithParamsFilterNonExists = 'validBodyWithParamsFilterNonExists'; //NOTE: will be populated with a non-existing ID

const validBodyWithInvalidStructure = { anyElement: 90 };

const validBodyWithCreateFields = { createFields: { name: 'name for test entity', description: 'description for test entity' } };
const invalidBodyWithCreateFields = { createFields: { name: '', description: 'A test entity with invalid name' } };

const validBodyWithUpdateFields = { updateFields: { name: 'updated name for test entity', description: 'An updated test entity' } };
const invalidBodyWithUpdateFields = { updateFields: { name: '', description: 'An updated test entity with invalid name' } };

const expectedBodySchemaEntity = object({
    name: string().required(),
    description: string().required(),
    _DB_id: string().required(),
});

const expectedBodySchemaArrayEntities = array().of(expectedBodySchemaEntity);

const expectedBodySchemaCount = object({
    count: number().required(),
});

const expectedBodySchemaTime = object({
    serverTime: string().required(),
});

const expectedBodySchemaHealth = object({
    status: string().oneOf(['ok']).required(),
    time: string().required(),
});

const expectedBodySchemaInit = object({
    status: string().oneOf(['Initialization complete']).required(),
    token: string().required(),
    csrfToken: string().required(),
});

const expectedBodySchemaCSRF = object({
    csrfToken: string().required(),
});

const expectedBodySchemaChallengue = object({
    token: string().required(),
});

const expectedBodySchemaError = object({
    error: string().required(),
});

const expectedBodySchemaMessage = object({
    message: string().required(),
});


const validTimeResponse = 1000; // 1 second
const validTimeResponseUnderLoad = 8000; // 5 seconds
const numberOfRequests = 10;

const MAXTIMEOUT = 10000; // 10 seconds

const populateTestData = async () => {
    {
        const response = await request(baseURL).post(`/api/${validEntity}/count`).set('Authorization', `Bearer ${validToken}`);
        if (response.status === 200) {
            if (response.body.count === 0) {
                const response = await request(baseURL).post(`/api/${validEntity}`).set('Authorization', `Bearer ${validToken}`).send(validBodyWithCreateFields);
                if (response.status === 200) {
                } else {
                    throw new Error('Create entity failed');
                }
            }
        } else {
            throw new Error('Count entity failed');
        }
    }
    {
        const response = await request(baseURL).get(`/api/${validEntity}/all`).set('Authorization', `Bearer ${validToken}`);

        if (response.status === 200 && Array.isArray(response.body)) {
            const entities = response.body;

            if (entities.length > 0) {
                let validEntityId = entities[0]._DB_id;
                let validBodyWithParamsFilter = { paramsFilter: { _id: entities[0]._DB_id } };

                // Generate a unique ID that does not exist in the current entities
                let nonExistentId;
                do {
                    nonExistentId = crypto.randomBytes(12).toString('hex'); // 12 bytes = 24 hex characters
                } while (entities.some((entity) => entity._DB_id === nonExistentId));
                let validNonExistsEntityId = nonExistentId;

                // // Generate a non-existing name
                // let nonExistentName = 'non exists name for test entity';
                // while (entities.some((entity) => entity.name === nonExistentName)) {
                //     nonExistentName = `non exists name for test entity ${uuidv4()}`;
                // }
                let validBodyWithParamsFilterNonExists = { paramsFilter: { _id: nonExistentId } };

                testData = { validEntityId, validBodyWithParamsFilter, validNonExistsEntityId, validBodyWithParamsFilterNonExists }; // Store the populated data

                return testData;
            } else {
                throw new Error('No entities found in the database');
            }
        } else {
            throw new Error('Failed to fetch entities from the database');
        }
    }
};

const deleteTestData = async () => {
    const response = await request(baseURL).get(`/api/${validEntity}/all`).set('Authorization', `Bearer ${validToken}`);
    if (response.status === 200 && Array.isArray(response.body)) {
        const entities = response.body;
        for (const entity of entities) {
            await request(baseURL).delete(`/api/${validEntity}/${entity._DB_id}`).set('Authorization', `Bearer ${validToken}`);
        }
    } else {
        throw new Error('Failed to fetch entities from the database for deletion');
    }
};


module.exports = {
    baseURL,
    validToken,
    invalidToken,
    validEntity,
    invalidEntity,
    validEntityId,
    invalidEntityId,
    validNonExistsEntityId,
    validBodyWithParamsFilter,
    validBodyWithParamsFilterNonExists,
    validBodyWithInvalidStructure,
    validBodyWithCreateFields,
    invalidBodyWithCreateFields,
    validBodyWithInvalidStructure,
    validBodyWithUpdateFields,
    invalidBodyWithUpdateFields,
    expectedBodySchemaEntity,
    expectedBodySchemaArrayEntities,
    expectedBodySchemaCount,
    expectedBodySchemaTime,
    expectedBodySchemaHealth,
    expectedBodySchemaInit,
    expectedBodySchemaCSRF,
    expectedBodySchemaChallengue,
    expectedBodySchemaError,
    expectedBodySchemaMessage,
    validTimeResponse,
    validTimeResponseUnderLoad,
    numberOfRequests,
    MAXTIMEOUT,
    populateTestData,
    deleteTestData
};

exports.populateTestData = populateTestData;
exports.deleteTestData = deleteTestData;
