const {
  validToken,
  productOptimizedEntity,
  productNoOptimizedEntity,
  validEntityId,
  expectedBodySchemaEntity,
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
    url: '/api/{entity}/{id}',
    entity: productOptimizedEntity,
    id: validEntityId,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaEntity,
    maxTimeResponse: validTimeResponse,
  },
  // Performance testing under load
  {
    category: 'Performance Testing',
    description: 'should assess response times under load using optimized entity',
    method: 'GET',
    url: '/api/{entity}/{id}',
    entity: productOptimizedEntity,
    id: validEntityId,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaEntity,
    numberOfRequests: numberOfRequests,
    maxTimeResponse: validTimeResponse,
    maxTimeResponseForParallelRequest: validTimeResponseUnderLoad,
  },
  // Performance testing
  {
    category: 'Performance Testing',
    description: 'should assess response time using no optimized entity',
    method: 'GET',
    url: '/api/{entity}/{id}',
    entity: productNoOptimizedEntity,
    id: validEntityId,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaEntity,
    maxTimeResponse: validTimeResponse,
  },
  // Performance testing under load
  {
    category: 'Performance Testing',
    description: 'should assess response times under load using no optimized entity',
    method: 'GET',
    url: '/api/{entity}/{id}',
    entity: productNoOptimizedEntity,
    id: validEntityId,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaEntity,
    numberOfRequests: numberOfRequests,
    maxTimeResponse: validTimeResponse,
    maxTimeResponseForParallelRequest: validTimeResponseUnderLoad,
  },
];

module.exports = {
  testCases,
};
