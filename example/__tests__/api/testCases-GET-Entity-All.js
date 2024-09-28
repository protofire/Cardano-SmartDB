const {
    validToken,
    invalidToken,
    validEntity,
    invalidEntity,
    expectedBodySchemaArrayEntities,
    validTimeResponse,
    validTimeResponseUnderLoad,
    numberOfRequests,
} = require('./baseTestCases');

const testCases = [
    // Valid scenarios
    {
        category: 'Positive and Negative Scenarios',
        description: 'should return 200 and a list of entities when valid entity and token are provided',
        method: 'GET',
        url: '/api/{entity}/all',
        entity: validEntity,
        token: validToken,
        expectedStatus: 200,
        expectedBodySchema: expectedBodySchemaArrayEntities,
    },
    // Invalid entity
    {
        category: 'Error Handling',
        description: 'should return 404 when invalid entity is provided',
        method: 'GET',
        url: '/api/{entity}/all',
        entity: invalidEntity,
        token: validToken,
        expectedStatus: 404,
        expectedBody: {},
    },
    // Invalid token
    {
        category: 'Authentication and Authorization',
        description: 'should return 401 when invalid token is provided',
        method: 'GET',
        url: '/api/{entity}/all',
        entity: validEntity,
        token: invalidToken,
        expectedStatus: 401,
        expectedBody: {},
    },
    // Missing entity
    {
        category: 'Data Validation',
        description: 'should return 404 when entity is missing',
        method: 'GET',
        url: '/api/{entity}/all',
        entity: '',
        token: validToken,
        expectedStatus: 404,
        expectedBody: {},
    },
    // Missing token
    {
        category: 'Authentication and Authorization',
        description: 'should return 401 when token is missing',
        method: 'GET',
        url: '/api/{entity}/all',
        entity: validEntity,
        token: '',
        expectedStatus: 401,
        expectedBody: {},
    },
    // Performance testing
    {
        category: 'Performance Testing',
        description: 'should assess response time',
        method: 'GET',
        url: '/api/{entity}/all',
        entity: validEntity,
        token: validToken,
        expectedStatus: 200,
        expectedBodySchema: expectedBodySchemaArrayEntities,
        maxTimeResponse: validTimeResponse,
    },
    // Performance testing under load
    {
        category: 'Performance Testing',
        description: 'should assess response times under load',
        method: 'GET',
        url: '/api/{entity}/all',
        entity: validEntity,
        token: validToken,
        expectedStatus: 200,
        expectedBodySchema: expectedBodySchemaArrayEntities,
        numberOfRequests: numberOfRequests,
        maxTimeResponse: validTimeResponse,
        maxTimeResponseForParallelRequest: validTimeResponseUnderLoad,
    },
];

module.exports = {
    testCases,
};
