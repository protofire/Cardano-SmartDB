
const {
    validToken,
    invalidToken,
    validEntity,
    invalidEntity,
    validBodyWithParamsFilter,
    validBodyWithParamsFilterNonExists,
    validBodyWithInvalidStructure,
    expectedBodySchemaCount,
    validTimeResponse,
    validTimeResponseUnderLoad,
    numberOfRequests,
} = require('./baseTestCases');


const testCases = [
    // // Valid scenarios
    // {
    //     category: 'Positive and Negative Scenarios',
    //     description: 'should return 200 and the count of entities when valid entity, body with paramsFilter, and token are provided',
    //     method: 'POST',
    //     url: '/api/{entity}/count',
    //     entity: validEntity,
    //     body: validBodyWithParamsFilter,
    //     token: validToken,
    //     expectedStatus: 200,
    //     expectedBodySchema: expectedBodySchemaCount,
    // },
    // // Non Exists ID
    // {
    //     category: 'Positive and Negative Scenarios',
    //     description: 'should return 200 with count 0 when Non Exists paramsFilter is provided',
    //     method: 'POST',
    //     url: '/api/{entity}/count',
    //     entity: validEntity,
    //     body: validBodyWithParamsFilterNonExists,
    //     token: validToken,
    //     expectedStatus: 200,
    //     expectedBody: { count: 0 },
    // },
    // // Invalid entity
    // {
    //     category: 'Error Handling',
    //     description: 'should return 404 when invalid entity is provided',
    //     method: 'POST',
    //     url: '/api/{entity}/count',
    //     entity: invalidEntity,
    //     body: validBodyWithParamsFilter,
    //     token: validToken,
    //     expectedStatus: 404,
    //     expectedBody: {},
    // },
    // // Invalid token
    // {
    //     category: 'Authentication and Authorization',
    //     description: 'should return 401 when invalid token is provided',
    //     method: 'POST',
    //     url: '/api/{entity}/count',
    //     entity: validEntity,
    //     body: validBodyWithParamsFilter,
    //     token: invalidToken,
    //     expectedStatus: 401,
    //     expectedBody: {},
    // },
    // // Missing entity
    // {
    //     category: 'Data Validation',
    //     description: 'should return 404 when entity is missing',
    //     method: 'POST',
    //     url: '/api/{entity}/count',
    //     entity: '',
    //     body: validBodyWithParamsFilter,
    //     token: validToken,
    //     expectedStatus: 404,
    //     expectedBody: {},
    // },
    // Invalid body structure
    {
        category: 'Data Validation',
        description: 'should return 200 when body has incorrect structure',
        method: 'POST',
        url: '/api/{entity}/count',
        entity: validEntity,
        body: validBodyWithInvalidStructure,
        token: validToken,
        expectedStatus: 200,
        expectedBodySchema: expectedBodySchemaCount,
    },
    // Missing paramsFilter
    {
        category: 'Data Validation',
        description: 'should return 200 when paramsFilter is missing',
        method: 'POST',
        url: '/api/{entity}/count',
        entity: validEntity,
        body: {},
        token: validToken,
        expectedStatus: 200,
        expectedBodySchema: expectedBodySchemaCount,
    },
    // Missing token
    {
        category: 'Authentication and Authorization',
        description: 'should return 401 when token is missing',
        method: 'POST',
        url: '/api/{entity}/count',
        entity: validEntity,
        body: validBodyWithParamsFilter,
        token: '',
        expectedStatus: 401,
        expectedBody: {},
    },
    // Performance testing
    {
        category: 'Performance Testing',
        description: 'should assess response time',
        method: 'POST',
        url: '/api/{entity}/count',
        entity: validEntity,
        body: validBodyWithParamsFilter,
        token: validToken,
        expectedStatus: 200,
        expectedBodySchema: expectedBodySchemaCount,
        maxTimeResponse: validTimeResponse,
    },
    // Performance testing under load
    {
        category: 'Performance Testing',
        description: 'should assess response times under load',
        method: 'POST',
        url: '/api/{entity}/count',
        entity: validEntity,
        body: validBodyWithParamsFilter,
        token: validToken,
        expectedStatus: 200,
        expectedBodySchema: expectedBodySchemaCount,
        numberOfRequests: numberOfRequests,
        maxTimeResponse: validTimeResponse,
        maxTimeResponseForParallelRequest: validTimeResponseUnderLoad,
    },
    // Security testing - SQL injection
    {
        category: 'Security Testing',
        description: 'should handle SQL injection attempts gracefully',
        method: 'POST',
        url: '/api/{entity}/count',
        entity: validEntity,
        body: { paramsFilter: { name: '1 OR 1=1' } },
        token: validToken,
        expectedStatus: 200,
        expectedBodySchema: expectedBodySchemaCount,
    },
    // Security testing - XSS
    {
        category: 'Security Testing',
        description: 'should handle XSS attempts gracefully',
        method: 'POST',
        url: '/api/{entity}/count',
        entity: validEntity,
        body: { paramsFilter: { name: '<script>alert("XSS")</script>' } },
        token: validToken,
        expectedStatus: 200,
        expectedBodySchema: expectedBodySchemaCount,
    },
];

module.exports = {
    testCases,
};
