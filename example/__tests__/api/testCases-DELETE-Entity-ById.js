const {
    validToken,
    invalidToken,
    validEntity,
    invalidEntity,
    validEntityId,
    invalidEntityId,
    validNonExistsEntityId,
    expectedBodySchemaEntity,
    expectedBodySchemaMessage,
    validTimeResponse,
    validTimeResponseUnderLoad,
    numberOfRequests,
} = require('./baseTestCases');

const testCases = [
    // Valid scenarios
    {
        category: 'Positive and Negative Scenarios',
        description: 'should return 200 and delete the entity when valid entity, ID, and token are provided',
        method: 'DELETE',
        url: '/api/{entity}/{id}',
        entity: validEntity,
        id: validEntityId,
        token: validToken,
        expectedStatus: 200,
        expectedBodySchema: expectedBodySchemaMessage,
    },
    // Invalid ID
    {
        category: 'Data Validation',
        description: 'should return 500 when invalid ID is provided',
        method: 'DELETE',
        url: '/api/{entity}/{id}',
        entity: validEntity,
        id: invalidEntityId,
        token: validToken,
        expectedStatus: 500,
        expectedBody: {},
    },
    // Non Exists ID
    {
        category: 'Positive and Negative Scenarios',
        description: 'should return 404 when Non Exists ID is provided',
        method: 'DELETE',
        url: '/api/{entity}/{id}',
        entity: validEntity,
        id: validNonExistsEntityId,
        token: validToken,
        expectedStatus: 404,
        expectedBody: {},
    },
    // Invalid entity
    {
        category: 'Error Handling',
        description: 'should return 404 when invalid entity is provided',
        method: 'DELETE',
        url: '/api/{entity}/{id}',
        entity: invalidEntity,
        id: validEntityId,
        token: validToken,
        expectedStatus: 404,
        expectedBody: {},
    },
    // Invalid token
    {
        category: 'Authentication and Authorization',
        description: 'should return 401 when invalid token is provided',
        method: 'DELETE',
        url: '/api/{entity}/{id}',
        entity: validEntity,
        id: validEntityId,
        token: invalidToken,
        expectedStatus: 401,
        expectedBody: {},
    },
    // Missing entity
    {
        category: 'Data Validation',
        description: 'should return 404 when entity is missing',
        method: 'DELETE',
        url: '/api/{entity}/{id}',
        entity: '',
        id: validEntityId,
        token: validToken,
        expectedStatus: 404,
        expectedBody: {},
    },
    // Missing ID
    {
        category: 'Data Validation',
        description: 'should return 405 when ID is missing',
        method: 'DELETE',
        url: '/api/{entity}/{id}',
        entity: validEntity,
        id: '',
        token: validToken,
        expectedStatus: 405,
        expectedBody: {},
    },
    // Missing token
    {
        category: 'Authentication and Authorization',
        description: 'should return 401 when token is missing',
        method: 'DELETE',
        url: '/api/{entity}/{id}',
        entity: validEntity,
        id: validEntityId,
        token: '',
        expectedStatus: 401,
        expectedBody: {},
    },
    // Security testing - SQL injection
    {
        category: 'Security Testing',
        description: 'should handle SQL injection attempts gracefully',
        method: 'DELETE',
        url: '/api/{entity}/{id}',
        entity: validEntity,
        id: '1 OR 1=1',
        token: validToken,
        expectedStatus: 500,
        expectedBody: {},
    },
    // Security testing - XSS
    {
        category: 'Security Testing',
        description: 'should handle XSS attempts gracefully',
        method: 'DELETE',
        url: '/api/{entity}/{id}',
        entity: validEntity,
        id: '<script>alert("XSS")</script>',
        token: validToken,
        expectedStatus: 500,
        expectedBody: {},
    },
];

module.exports = {
    testCases,
};
