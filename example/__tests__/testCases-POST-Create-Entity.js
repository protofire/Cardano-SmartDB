const {
    validToken,
    invalidToken,
    validEntity,
    invalidEntity,
    validBodyWithCreateFields,
    invalidBodyWithCreateFields,
    validBodyWithInvalidStructure,
    validTimeResponse,
    validTimeResponseUnderLoad,
    numberOfRequests,
} = require('./baseTestCases');

const testCases = [
    // Valid scenarios
    {
        category: 'Positive and Negative Scenarios',
        description: 'should return 200 when valid entity, body with createFields, and token are provided',
        method: 'POST',
        url: '/api/{entity}',
        entity: validEntity,
        body: validBodyWithCreateFields,
        token: validToken,
        expectedStatus: 200,
        expectedBody: {}, // Adjust expected body based on actual API response
    },
    // Invalid createFields
    {
        category: 'Data Validation',
        description: 'should return 500 when invalid createFields are provided',
        method: 'POST',
        url: '/api/{entity}',
        entity: validEntity,
        body: invalidBodyWithCreateFields,
        token: validToken,
        expectedStatus: 500,
        expectedBody: {},
    },
    // Invalid body structure
    {
        category: 'Data Validation',
        description: 'should return 400 when body has incorrect structure',
        method: 'POST',
        url: '/api/{entity}',
        entity: validEntity,
        body: validBodyWithInvalidStructure,
        token: validToken,
        expectedStatus: 400,
        expectedBody: {},
    },
    // Invalid entity
    {
        category: 'Error Handling',
        description: 'should return 404 when invalid entity is provided',
        method: 'POST',
        url: '/api/{entity}',
        entity: invalidEntity,
        body: validBodyWithCreateFields,
        token: validToken,
        expectedStatus: 404,
        expectedBody: {},
    },
    // Invalid token
    {
        category: 'Authentication and Authorization',
        description: 'should return 401 when invalid token is provided',
        method: 'POST',
        url: '/api/{entity}',
        entity: validEntity,
        body: validBodyWithCreateFields,
        token: invalidToken,
        expectedStatus: 401,
        expectedBody: {},
    },
    // Missing entity
    {
        category: 'Data Validation',
        description: 'should return 404 when entity is missing',
        method: 'POST',
        url: '/api/{entity}',
        entity: '',
        body: validBodyWithCreateFields,
        token: validToken,
        expectedStatus: 404,
        expectedBody: {},
    },
    // Missing createFields
    {
        category: 'Data Validation',
        description: 'should return 400 when createFields are missing',
        method: 'POST',
        url: '/api/{entity}',
        entity: validEntity,
        body: {},
        token: validToken,
        expectedStatus: 400,
        expectedBody: {},
    },
    // Missing token
    {
        category: 'Authentication and Authorization',
        description: 'should return 401 when token is missing',
        method: 'POST',
        url: '/api/{entity}',
        entity: validEntity,
        body: validBodyWithCreateFields,
        token: '',
        expectedStatus: 401,
        expectedBody: {},
    },
    // Performance testing
    {
        category: 'Performance Testing',
        description: 'should assess response time',
        method: 'POST',
        url: '/api/{entity}',
        entity: validEntity,
        body: validBodyWithCreateFields,
        token: validToken,
        expectedStatus: 200,
        expectedBody: {}, // Adjust expected body based on actual API response
        maxTimeResponse: validTimeResponse,
    },
    // Performance testing under load
    {
        category: 'Performance Testing',
        description: 'should assess response times under load',
        method: 'POST',
        url: '/api/{entity}',
        entity: validEntity,
        body: validBodyWithCreateFields,
        token: validToken,
        expectedStatus: 200,
        expectedBody: {}, // Adjust expected body based on actual API response
        numberOfRequests: numberOfRequests,
        maxTimeResponse: validTimeResponse,
        maxTimeResponseForParallelRequest: validTimeResponseUnderLoad,
    },
    // Security testing - SQL injection
    {
        category: 'Security Testing',
        description: 'should handle SQL injection attempts gracefully',
        method: 'POST',
        url: '/api/{entity}',
        entity: validEntity,
        body: { createFields: { name: '1 OR 1=1', description: '1 OR 1=1' } },
        token: validToken,
        expectedStatus: 200,
        expectedBody: {},
    },
    // Security testing - XSS
    {
        category: 'Security Testing',
        description: 'should handle XSS attempts gracefully',
        method: 'POST',
        url: '/api/{entity}',
        entity: validEntity,
        body: { createFields: { name: 'There are tags here: <script>alert("XSS")</script>, but they will be deleted', description: 'There are tags here: <script>alert("XSS")</script>, but they will be deleted' } },
        token: validToken,
        expectedStatus: 200,
        expectedBody: {},
    },
];

module.exports = {
    testCases,
};
