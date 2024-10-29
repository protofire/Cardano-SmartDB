import { yup } from 'smart-db';
import request from 'supertest';
import { baseURL, deleteTestData, MAXTIMEOUT, populateTestData, validToken } from './baseTestCases.js';

import { testCases as getEntityAllSituations } from './testCases-POST-ALL-Situations.js';
import { testCases as performanceComparison } from './testCases-POST-Optimized-Entity-Comparison.js';

interface TestCase {
    method: 'GET' | 'POST' | 'DELETE'; // Add more methods if needed
    url: string;
    entity: string;
    body?: Record<string, any> | string;
    id?: string;
    token: string;
    expectedStatus: number;
    expectedBody?: Record<string, any> | string;
    expectedBodySchema?: yup.Schema<any> | string;
    maxTimeResponse?: number;
    numberOfRequests?: number;
    maxTimeResponseForParallelRequest?: number;
}


const testCaseGroups = [
    { name:  '#01 Get All case of use', testCases: getEntityAllSituations as TestCase[] },
    { name:  '#02 Get All case of use', testCases: getEntityAllSituations as TestCase[] },
    { name:  '#03 Get All case of use', testCases: getEntityAllSituations as TestCase[] },
    { name:  '#04 Get All case of use', testCases: getEntityAllSituations as TestCase[] },
    { name:  '#05 Get All case of use', testCases: getEntityAllSituations as TestCase[] },
    { name:  '#06 Get All case of use', testCases: getEntityAllSituations as TestCase[] },
    { name:  '#07 Get All case of use', testCases: getEntityAllSituations as TestCase[] },
    { name:  '#08 Get All case of use', testCases: getEntityAllSituations as TestCase[] },
    { name:  '#09 Get All case of use', testCases: getEntityAllSituations as TestCase[] },
    { name:  '#10 Get All case of use', testCases: getEntityAllSituations as TestCase[] },

    { name: '#01 Performance Testing', testCases: performanceComparison as TestCase[] },
    { name: '#02 Performance Testing', testCases: performanceComparison as TestCase[] },
    { name: '#03 Performance Testing', testCases: performanceComparison as TestCase[] },
    { name: '#04 Performance Testing', testCases: performanceComparison as TestCase[] },
    { name: '#05 Performance Testing', testCases: performanceComparison as TestCase[] },
    { name: '#06 Performance Testing', testCases: performanceComparison as TestCase[] },
    { name: '#07 Performance Testing', testCases: performanceComparison as TestCase[] },
    { name: '#08 Performance Testing', testCases: performanceComparison as TestCase[] },
    { name: '#09 Performance Testing', testCases: performanceComparison as TestCase[] },
    { name: '#10 Performance Testing', testCases: performanceComparison as TestCase[] }
];
let testData = {};

function parseTestCase(testCase: Record<string, any>, testData: Record<string, any>): Record<string, any> {
    const parsedTestCase = { ...testCase };

    const replaceValues = (obj: any): any => {
        if (Array.isArray(obj)) {
            return obj.map(replaceValues);
        } else if (obj && typeof obj === 'object') {
            // const newObj: any = {};
            for (const key in obj) {
                // if (obj.hasOwnProperty(key)) {
                obj[key] = replaceValues(obj[key]);
                // }
            }
            return obj;
        } else if (typeof obj === 'string' && testData.hasOwnProperty(obj)) {
            return testData[obj];
        } else {
            return obj;
        }
    };

    return replaceValues(parsedTestCase);
}

beforeAll(async () => {
    console.log('Loading Data...');
    testData = await populateTestData();
    console.log('Data Loaded');
}, MAXTIMEOUT);

afterAll(async () => {
    // console.log('Cleaning up data...');
    // await deleteTestData();
    // console.log('Data cleanup complete');
}, MAXTIMEOUT);

describe('API Tests', () => {
    testCaseGroups.forEach(({ name, testCases }) => {
        describe(name, () => {
            test.each(testCases)(
                '$description',
                async (testCase) => {
                    const parsedTestCase = parseTestCase(testCase, testData);
                    const {
                        method,
                        url,
                        entity,
                        id,
                        body,
                        token,
                        expectedStatus,
                        expectedBody,
                        expectedBodySchema,
                        maxTimeResponse,
                        numberOfRequests,
                        maxTimeResponseForParallelRequest,
                    } = parsedTestCase;

                    const parsedUrl = url.replace('{entity}', entity).replace('{id}', id || '');

                    console.log(`Method: ${method}, URL: ${parsedUrl}, Body: ${JSON.stringify(body)}`);

                    const executeRequest = async () => {
                        const start = Date.now();
                        let response;

                        const makeRequest = async (reqMethod: string, reqUrl: string, reqBody?: Record<string, any>) => {
                            switch (reqMethod) {
                                case 'GET':
                                    return await request(baseURL)
                                        .get(reqUrl)
                                        .set('Authorization', token ? `Bearer ${token}` : '');
                                case 'POST':
                                    return await request(baseURL)
                                        .post(reqUrl)
                                        .set('Authorization', token ? `Bearer ${token}` : '')
                                        .send(reqBody);
                                case 'DELETE':
                                    return await request(baseURL)
                                        .delete(reqUrl)
                                        .set('Authorization', token ? `Bearer ${token}` : '');
                                // Add more cases for other methods if needed
                                default:
                                    throw new Error(`Unsupported method: ${reqMethod}`);
                            }
                        };

                        response = await makeRequest(method, parsedUrl, body);

                        if (response.status === 308) {
                            // console.log(`Handling 308 redirect for ${method} ${parsedUrl} to ${response.headers.location}`);
                            response = await makeRequest(method, response.headers.location, body);
                        }

                        // console.log(`Response Status: ${response.status}, Method: ${method}`);

                        const end = Date.now();
                        const responseTime = end - start;

                        expect(response.status).toBe(expectedStatus);

                        // console.log(`Response Body: ${showData(response.body, false)}`);

                        if (expectedBody && Object.keys(expectedBody).length > 0) {
                            expect(response.body).toEqual(expectedBody);
                        }

                        if (expectedBodySchema) {
                            try {
                                await expectedBodySchema.validate(response.body);
                            } catch (error: any) {
                                throw new Error('Response Body Schema Validation - ' + error.message);
                            }
                        }

                        if (maxTimeResponse !== undefined) {
                            // console.log(`Response time for ${parsedUrl}: ${responseTime} ms`);
                            expect(responseTime).toBeLessThanOrEqual(maxTimeResponse);
                        }

                        return responseTime;
                    };

                    if (numberOfRequests && numberOfRequests > 1) {
                        const requests = Array(numberOfRequests).fill(0).map(executeRequest);
                        const responseTimes = await Promise.all(requests);
                        const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
                        const totalResponseTime = responseTimes.reduce((a, b) => a + b, 0);

                        // console.log(`Average Response Time for ${numberOfRequests} requests: ${averageResponseTime} ms`);
                        // console.log(`Total Response Time for ${numberOfRequests} requests: ${totalResponseTime} ms`);
                        if (maxTimeResponseForParallelRequest !== undefined) {
                            expect(totalResponseTime).toBeLessThanOrEqual(maxTimeResponseForParallelRequest);
                        }
                    } else {
                        await executeRequest();
                    }
                },
                MAXTIMEOUT
            );
        });
    });
});
