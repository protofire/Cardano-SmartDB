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

const productOptimizedEntity = 'product-opt';
const productNoOptimizedEntity = 'product-no-opt';

const validEntityName = 'validEntityname'; //NOTE: will be populated with a valid name

const validBodyWithParamsNameFilter = 'validBodyWithParamsNameFilter';
const validBodyWithParamsNameAndCategoryFilter = 'validBodyWithParamsNameAndCategoryFilter';

const expectedBodySchemaEntity = object({
    name: string().required(),
    description: string().required(),
    _DB_id: string().required(),
});

const expectedBodySchemaArrayEntities = array().of(expectedBodySchemaEntity);

const validTimeResponse = 6000000; // 1 second
const numberOfRequests = 50;
const numberOfEntities = 10000;

const MAXTIMEOUT = 6000000; // 10 seconds

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
            if (responseOpt.body.count < numberOfEntities) {
                for (let i = responseOpt.body.count; i < numberOfEntities; i++) {
                    const product = generateRandomProduct();
                    await createProduct(product);
                }
            }
        } else {
            throw new Error('Failed to fetch entities from the database');
        }
    }
    {
        const response = await request(baseURL).get(`/api/${productOptimizedEntity}/all`).set('Authorization', `Bearer ${validToken}`);

        if (response.status === 200 && Array.isArray(response.body)) {
            const entities = response.body;

            if (entities.length > 0) {
                let validEntityName = entities[0].name;
                let validBodyWithParamsNameFilter = { paramsFilter: { name: entities[0].name } };
                let validBodyWithParamsNameAndCategoryFilter = { paramsFilter: { name: entities[0].name, category: entities[1].category } };
                testData = { validEntityName, validBodyWithParamsNameFilter, validBodyWithParamsNameAndCategoryFilter }; // Store the populated data
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
    productOptimizedEntity,
    productNoOptimizedEntity,
    validEntityName,
    validBodyWithParamsNameFilter,
    validBodyWithParamsNameAndCategoryFilter,
    expectedBodySchemaEntity,
    expectedBodySchemaArrayEntities,
    validTimeResponse,
    numberOfRequests,
    MAXTIMEOUT,
    populateTestData,
    deleteTestData,
};

exports.populateTestData = populateTestData;
exports.deleteTestData = deleteTestData;
