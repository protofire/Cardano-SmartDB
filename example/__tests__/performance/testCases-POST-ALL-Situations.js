const yup = require('yup');
const {
  validToken,
  productOptimizedEntity,
  expectedBodySchemaArrayEntities,
  validTimeResponse,
} = require('./baseTestCases');

const testCases = [
  // Performance testing
  {
    category: 'Get all situations',
    description: 'Get all',
    method: 'POST',
    url: '/api/{entity}/all',
    entity: productOptimizedEntity,
    body: {},
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    maxTimeResponse: validTimeResponse,
  },
  // Performance testing under load
  {
    category: 'Get all situations',
    description: 'Get all using SELECT with id, name and description filds',
    method: 'POST',
    url: '/api/{entity}/all',
    entity: productOptimizedEntity,
    body: { fieldsForSelect: {description: true, _id: true, name: true}  },
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    maxTimeResponse: validTimeResponse,
  },
  // Performance testing
  {
    category: 'Get all situations',
    description: 'Get all using limit in 4',
    method: 'POST',
    url: '/api/{entity}/all',
    entity: productOptimizedEntity,
    body: {limit:4},
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    maxTimeResponse: validTimeResponse,
  },
  // Performance testing under load
  {
    category: 'Get all situations',
    description: 'Get all sorting by name',
    method: 'POST',
    url: '/api/{entity}/all',
    entity: productOptimizedEntity,
    body: {sort:{name:1}},
    token: validToken,
    expectedStatus: 200,
    expectedBodySchema: expectedBodySchemaArrayEntities,
    maxTimeResponse: validTimeResponse,
  },
];

module.exports = {
  testCases,
};
