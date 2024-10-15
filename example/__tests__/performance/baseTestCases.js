const { object, string, array, number, oneOf } = require('yup');
const request = require('supertest');
const crypto = require('crypto'); // Add the crypto

const baseURL = 'http://localhost:3000'; // Change the port if your server runs on a different port

// NOTE: Valid token must be provided in order to try all tests rutes!
const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaXRlU2VjcmV0IjoiM2RjNmRiZDFjMWNiZmQ1MGNhZjYzNDMyNDAzMWYzNGU0NzFmMGRiOGYzMWI1YjU0Y2FhMGUzODkzMWNkNGY3YyIsInRpbWVzdGFtcCI6MTcyNzIwMDM2MjE2MCwiY3JlZGVudGlhbHMiOnsiYWRkcmVzcyI6ImFkZHJfdGVzdDF2emg0OHBzenFoaGhhdm5ydTUyZHV5cTgzZ2F5dWo0emM1eXZhczRyOHRhOHowcXEydnd5ZiIsIndhbGxldE5hbWVPclNlZWRPcktleSI6ImVkMjU1MTlfc2sxc2g1bDZ1bmN2amc3bXdzZ2dwZ3YwbDN5YzRkazYyNTl1a2x0eGxoMDVyN3ZrZzZrZHc3c3BuZDI1aiIsInVzZUJsb2NrZnJvc3RUb1N1Ym1pdCI6ImZhbHNlIiwiaXNXYWxsZXRGcm9tU2VlZCI6ImZhbHNlIiwiaXNXYWxsZXRGcm9tS2V5IjoidHJ1ZSIsImNoYWxsZW5ndWUiOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKemFYUmxVMlZqY21WMElqb2lNMlJqTm1SaVpERmpNV05pWm1RMU1HTmhaall6TkRNeU5EQXpNV1l6TkdVME56Rm1NR1JpT0dZek1XSTFZalUwWTJGaE1HVXpPRGt6TVdOa05HWTNZeUlzSW5ScGJXVnpkR0Z0Y0NJNk1UY3lOekl3TURNMk1qRXdNeXdpYVdGMElqb3hOekkzTWpBd016WXlMQ0psZUhBaU9qRTNNamszT1RJek5qSjkuQzhLbl9HUVVaWXR5RWtYejdyNXFNLVI4d3phbG5DeURVdDFUVkh3aDBUYyIsInNpZ25lZENoYWxsZW5ndWUiOiJ7XCJzaWduYXR1cmVcIjpcIjg0NTgyYWEyMDEyNzY3NjE2NDY0NzI2NTczNzM1ODFkNjBhZjUzODYwMjA1ZWY3ZWIyNjNlNTE0ZGUxMDA3OGEzYTRlNGFhMmM1MDhjZWMyYTMzYWZhNzEzY2ExNjY2ODYxNzM2ODY1NjRmNDU5MDEwZDY1Nzk0YTY4NjI0NzYzNjk0ZjY5NGE0OTU1N2E0OTMxNGU2OTQ5NzM0OTZlNTIzNTYzNDM0OTM2NDk2YjcwNTg1NjQzNGEzOTJlNjU3OTRhN2E2MTU4NTI2YzU1MzI1NjZhNjM2ZDU2MzA0OTZhNmY2OTRkMzI1MjZhNGU2ZDUyNjk1YTQ0NDY2YTRkNTc0ZTY5NWE2ZDUxMzE0ZDQ3NGU2ODVhNmE1OTdhNGU0NDRkNzk0ZTQ0NDE3YTRkNTc1OTdhNGU0NzU1MzA0ZTdhNDY2ZDRkNDc1MjY5NGY0NzU5N2E0ZDU3NDkzMTU5NmE1NTMwNTkzMjQ2Njg0ZDQ3NTU3YTRmNDQ2YjdhNGQ1NzRlNmI0ZTQ3NTkzMzU5Nzk0OTczNDk2ZTUyNzA2MjU3NTY3YTY0NDc0Njc0NjM0MzQ5MzY0ZDU0NjM3OTRlN2E0OTc3NGQ0NDRkMzI0ZDZhNDU3NzRkNzk3NzY5NjE1NzQ2MzA0OTZhNmY3ODRlN2E0OTMzNGQ2YTQxNzc0ZDdhNTk3OTRjNDM0YTZjNjU0ODQxNjk0ZjZhNDUzMzRkNmE2YjMzNGY1NDQ5N2E0ZTZhNGEzOTJlNDMzODRiNmU1ZjQ3NTE1NTVhNTk3NDc5NDU2YjU4N2EzNzcyMzU3MTRkMmQ1MjM4Nzc3YTYxNmM2ZTQzNzk0NDU1NzQzMTU0NTY0ODc3NjgzMDU0NjM1ODQwMTBlMWQ4NWFjZmJkNmNmMjFiZjFkNmQzZTQwMDEzMGNjN2I5ZjZmOTNjMzk0MmNhNjA0Y2IxOWZmNTk2NTBiYzQ1MGRhYmY3MmQyZGUyZGFmNDdhMmUxMGE0OGQ0YjI3ZTcyMzlhMGI1Y2U0M2M2NjU1ODU4MTE4YjgxMTdmMGNcIixcImtleVwiOlwiYTQwMTAxMDMyNzIwMDYyMTU4MjBlY2UwOWVmOWFhMGY1NDVmNDNjYTUzYzFjZTBjZGJlNjg1Mjc2NmVlOWY0ZGVhODFhODVjMzA4Zjk0NDhhN2Q5XCJ9In0sImlhdCI6MTcyNzIwMDM2MiwiZXhwIjoxNzI5NzkyMzYyfQ.VpeJHgyK6dWpB2YWD3bMIuKK-uR1JSWvN27r_xXE1gI';
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
