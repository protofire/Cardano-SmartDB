const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const myEnv = dotenv.config({ path: './.env' });
dotenvExpand.expand(myEnv);


const { object, string, array, number, oneOf } = require('yup');
const request = require('supertest');
const crypto = require('crypto'); // Add the crypto
const { faker } = require('@faker-js/faker');

const baseURL = 'http://localhost:3000'; // Change the port if your server runs on a different port

// NOTE: Valid token must be provided in order to try all tests rutes!
const validToken = process.env.AUTH_TOKEN;
const invalidToken = 'invalidToken';

const productOptimizedEntity = 'product-opt';
const productNoOptimizedEntity = 'product-no-opt';
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

const validTimeResponse = 10000; // 1 second
const validTimeResponseUnderLoad = 16000; // 5 seconds
const numberOfRequests = 10;

const MAXTIMEOUT = 10000; // 10 seconds

function generateRandomProduct() {
  return {
    createFields: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price(10, 1000, 2)),
      stock: faker.number.int({ min: 0, max: 500 }),
      category: faker.commerce.department(),
      createdAt: faker.date.past(), // Fecha en el pasado aleatoria
      updatedAt: faker.date.recent(), // Fecha reciente
    },
  };
}

// Función para enviar una solicitud POST a la API para crear un producto
async function createProduct(product) {
  try {
    await request(baseURL).post(`/api/${productOptimizedEntity}`).set('Authorization', `Bearer ${validToken}`).send(product);
    await request(baseURL).post(`/api/${productNoOptimizedEntity}`).set('Authorization', `Bearer ${validToken}`).send(product);
    // console.log(`Created product: ${responseOpt.data._id}`);
  } catch (error) {
    console.error('Create no optimized entity failed:', error.responseOpt?.data || error.message);
    console.error('Create optimized entity failed:', error.responseNoOpt?.data || error.message);
  }
}

const populateTestData = async () => {
  {
    const responseOpt = await request(baseURL).post(`/api/${productOptimizedEntity}/count`).set('Authorization', `Bearer ${validToken}`);
    const responseNoOpt = await request(baseURL).post(`/api/${productNoOptimizedEntity}/count`).set('Authorization', `Bearer ${validToken}`);
    if (responseOpt.status === 200 && responseNoOpt.status === 200) {
      if (responseOpt.body.count === 0 && responseNoOpt.body.count === 0) {
        for (let i = 0; i < 1000; i++) {
          const product = generateRandomProduct();
          await createProduct(product);
        }
      } else {
        throw new Error('Count entity failed');
      }
    }
  }
  {
    const response = await request(baseURL).get(`/api/${productOptimizedEntity}/all`).set('Authorization', `Bearer ${validToken}`);

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
  const responseOpt = await request(baseURL).get(`/api/${productOptimizedEntity}/all`).set('Authorization', `Bearer ${validToken}`);
  const responseNoOpt = await request(baseURL).get(`/api/${productNoOptimizedEntity}/all`).set('Authorization', `Bearer ${validToken}`);
  if (responseOpt.status === 200 && Array.isArray(responseOpt.body) && responseNoOpt.status === 200 && Array.isArray(responseNoOpt.body)) {
    const entities = responseOpt.body;
    for (const entity of entities) {
      await request(baseURL).delete(`/api/${productOptimizedEntity}/${entity._DB_id}`).set('Authorization', `Bearer ${validToken}`);
      await request(baseURL).delete(`/api/${productNoOptimizedEntity}/${entity._DB_id}`).set('Authorization', `Bearer ${validToken}`);
    }
  } else {
    throw new Error('Failed to fetch entities from the database for deletion');
  }
};

module.exports = {
  baseURL,
  validToken,
  invalidToken,
  productOptimizedEntity,
  productNoOptimizedEntity,
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
  deleteTestData,
};

exports.populateTestData = populateTestData;
exports.deleteTestData = deleteTestData;
