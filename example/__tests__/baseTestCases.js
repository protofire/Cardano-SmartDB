const { object, string, array, number, oneOf } = require('yup');
const request = require('supertest');
const crypto = require('crypto'); // Add the crypto

const baseURL = 'http://localhost:3000'; // Change the port if your server runs on a different port
const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaXRlU2VjcmV0IjoiZjFjZWU0ODY2ODdjNDc5N2NhNTQzZTdmOWVlZTQwZGMwMzhjY2E2MDU5ZmQ4YmM0N2E2M2ZiYjY4MmUyOTdlMCIsInRpbWVzdGFtcCI6MTcxNjAxMDczMTE4NCwiY3JlZGVudGlhbHMiOnsiYWRkcmVzcyI6ImFkZHJfdGVzdDF2cXVsbTM1OTRkc3dsanAzZzhhd3Fkc3p5dDd3cWZxNmFuNnJ4MGc2YXJrZmZlc3RxdW5zZiIsIndhbGxldE5hbWVPclNlZWRPcktleSI6ImVkMjU1MTlfc2sxZmRkcm5qNjJhN2xjOHEyZjI5OTd6ZGV6am5uMGFxOXU3NHkwcXY5ZWgzNGVkd3Bmamtnc3hjZzBtdyIsInVzZUJsb2NrZnJvc3RUb1N1Ym1pdCI6ImZhbHNlIiwiaXNXYWxsZXRGcm9tU2VlZCI6ImZhbHNlIiwiaXNXYWxsZXRGcm9tS2V5IjoidHJ1ZSIsImNoYWxsZW5ndWUiOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKemFYUmxVMlZqY21WMElqb2laakZqWldVME9EWTJPRGRqTkRjNU4yTmhOVFF6WlRkbU9XVmxaVFF3WkdNd016aGpZMkUyTURVNVptUTRZbU0wTjJFMk0yWmlZalk0TW1VeU9UZGxNQ0lzSW5ScGJXVnpkR0Z0Y0NJNk1UY3hOakF4TURjek1URXlOU3dpYVdGMElqb3hOekUyTURFd056TXhMQ0psZUhBaU9qRTNNVGcyTURJM016RjkuLUhwVlJ1YWVaeURYM0FYZTdpTElXejRjQk1XVmoyUGwxTXJFNG5qMllZZyIsInNpZ25lZENoYWxsZW5ndWUiOiJ7XCJzaWduYXR1cmVcIjpcIjg0NTgyYWEyMDEyNzY3NjE2NDY0NzI2NTczNzM1ODFkNjAzOWZkYzY4NWFiNjBlZmM4MzE0MWZhZTAzNjAyMjJmY2UwMjQxYWVjZjQzMzNkMWFlOGVjOTRlNmExNjY2ODYxNzM2ODY1NjRmNDU5MDEwZDY1Nzk0YTY4NjI0NzYzNjk0ZjY5NGE0OTU1N2E0OTMxNGU2OTQ5NzM0OTZlNTIzNTYzNDM0OTM2NDk2YjcwNTg1NjQzNGEzOTJlNjU3OTRhN2E2MTU4NTI2YzU1MzI1NjZhNjM2ZDU2MzA0OTZhNmY2OTVhNmE0NjZhNWE1NzU1MzA0ZjQ0NTkzMjRmNDQ2NDZhNGU0NDYzMzU0ZTMyNGU2ODRlNTQ1MTdhNWE1NDY0NmQ0ZjU3NTY2YzVhNTQ1MTc3NWE0NzRkNzc0ZDdhNjg2YTU5MzI0NTMyNGQ0NDU1MzU1YTZkNTEzNDU5NmQ0ZDMwNGUzMjQ1MzI0ZDMyNWE2OTU5NmE1OTM0NGQ2ZDU1Nzk0ZjU0NjQ2YzRkNDM0OTczNDk2ZTUyNzA2MjU3NTY3YTY0NDc0Njc0NjM0MzQ5MzY0ZDU0NjM3ODRlNmE0MTc4NGQ0NDYzN2E0ZDU0NDU3OTRlNTM3NzY5NjE1NzQ2MzA0OTZhNmY3ODRlN2E0NTMyNGQ0NDQ1Nzc0ZTdhNGQ3ODRjNDM0YTZjNjU0ODQxNjk0ZjZhNDUzMzRkNTQ2NzMyNGQ0NDQ5MzM0ZDdhNDYzOTJlMmQ0ODcwNTY1Mjc1NjE2NTVhNzk0NDU4MzM0MTU4NjUzNzY5NGM0OTU3N2EzNDYzNDI0ZDU3NTY2YTMyNTA2YzMxNGQ3MjQ1MzQ2ZTZhMzI1OTU5Njc1ODQwMWYxYjNmYjNmOWNlYzM2NTVkYzA0ZjYxZWQ3YzJkOGM3MzEyODY2MGNmYzI1OThmNjdlZmI2ZGY5YjgwMDViZjBhNjg2Nzk2ZjUxOWVkY2NkNTgyZmYxM2U5NmE2MGE3ZWRkZDMzMWI0MWZhYmIzMzk4NTM4ZDBlYmRiN2MwMDZcIixcImtleVwiOlwiYTQwMTAxMDMyNzIwMDYyMTU4MjBlOTI3YjhmMDJjOTg1NzVlNzg1MDUwOTg5Mzg5MGIxOTgxZTM1YmFmZDRiYzM0YzA5NGFjM2IwMjJhZmMzYmQ2XCJ9In0sImlhdCI6MTcxNjAxMDczMSwiZXhwIjoxNzE4NjAyNzMxfQ.-v4Nd1H08JhkW0sf_Zvj45x-1-DtkQWZr-ErJ067ZmQ';
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
const validTimeResponseUnderLoad = 5000; // 5 seconds
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
