const yup = require('yup');
const {
  validToken,
  productOptimizedEntity,
  productNoOptimizedEntity,
  validBodyWithWithSelect,
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
    method: 'POST',
    url: '/api/{entity}/by-params',
    entity: productOptimizedEntity,
    body: validBodyWithWithSelect,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    maxTimeResponse: validTimeResponse,
  },
  // Performance testing under load
  {
    category: 'Performance Testing',
    description: 'should assess response times under load using optimized entity',
    method: 'POST',
    url: '/api/{entity}/by-params',
    entity: productOptimizedEntity,
    body: validBodyWithWithSelect,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    numberOfRequests: numberOfRequests,
    maxTimeResponse: validTimeResponse,
    maxTimeResponseForParallelRequest: validTimeResponseUnderLoad,
  },
  // Performance testing
  {
    category: 'Performance Testing',
    description: 'should assess response time no using optimized entity',
    method: 'POST',
    url: '/api/{entity}/by-params',
    entity: productNoOptimizedEntity,
    body: validBodyWithWithSelect,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    maxTimeResponse: validTimeResponse,
  },
  // Performance testing under load
  {
    category: 'Performance Testing',
    description: 'should assess response times under load no using optimized entity',
    method: 'POST',
    url: '/api/{entity}/by-params',
    entity: productNoOptimizedEntity,
    body: validBodyWithWithSelect,
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
