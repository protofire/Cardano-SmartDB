const yup = require('yup');
const {
  validToken,
  productOptimizedEntity,
  productNoOptimizedEntity,
  validBodyWithParamsNameFilter,
  validBodyWithParamsNameAndCategoryFilter,
  expectedBodySchemaArrayEntities,
  validTimeResponse,
} = require('./baseTestCases');

const testCases = [
  // Performance testing
  {
    category: 'Performance Testing',
    description: 'should assess response time using optimized entity filter by name',
    method: 'POST',
    url: '/api/{entity}/by-params',
    entity: productOptimizedEntity,
    body: validBodyWithParamsNameFilter,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    maxTimeResponse: validTimeResponse,
  },
  // Performance testing
  {
    category: 'Performance Testing',
    description: 'should assess response time no using optimized entity filter by name',
    method: 'POST',
    url: '/api/{entity}/by-params',
    entity: productNoOptimizedEntity,
    body: validBodyWithParamsNameFilter,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    maxTimeResponse: validTimeResponse,
  },
  // Performance testing
  {
    category: 'Performance Testing',
    description: 'should assess response time using optimized entity filter by name and category',
    method: 'POST',
    url: '/api/{entity}/by-params',
    entity: productOptimizedEntity,
    body: validBodyWithParamsNameAndCategoryFilter,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    maxTimeResponse: validTimeResponse,
  },
  // Performance testing
  {
    category: 'Performance Testing',
    description: 'should assess response time no using optimized entity by name and category',
    method: 'POST',
    url: '/api/{entity}/by-params',
    entity: productNoOptimizedEntity,
    body: validBodyWithParamsNameAndCategoryFilter,
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    maxTimeResponse: validTimeResponse,
  },
];

module.exports = {
  testCases,
};
