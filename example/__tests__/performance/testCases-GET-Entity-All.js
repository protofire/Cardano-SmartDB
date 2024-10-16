const {
  validToken,
  productOptimizedEntity,
  productNoOptimizedEntity,
  expectedBodySchemaArrayEntities,
  validTimeResponse,
  validTimeResponseUnderLoad,
  numberOfRequests,
} = require('./baseTestCases');

const testCases = [
  // Performance testing
  {
    category: 'Performance Testing',
    description: 'should assess response time using optimized entity',
    method: 'GET',
    url: '/api/{entity}/all',
    entity: productOptimizedEntity,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    maxTimeResponse: validTimeResponse,
  },
  // Performance testing under load
  {
    category: 'Performance Testing',
    description: 'should assess response times under load using optimized entity',
    method: 'GET',
    url: '/api/{entity}/all',
    entity: productOptimizedEntity,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    numberOfRequests: numberOfRequests,
    maxTimeResponse: validTimeResponse,
    maxTimeResponseForParallelRequest: validTimeResponseUnderLoad,
  }, // Performance testing
  {
    category: 'Performance Testing',
    description: 'should assess response time using no optimized entity',
    method: 'GET',
    url: '/api/{entity}/all',
    entity: productNoOptimizedEntity,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    maxTimeResponse: validTimeResponse,
  },
  // Performance testing under load
  {
    category: 'Performance Testing',
    description: 'should assess response times under load using no optimized entity',
    method: 'GET',
    url: '/api/{entity}/all',
    entity: productNoOptimizedEntity,
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
