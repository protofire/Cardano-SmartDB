const fs = require('fs');
const path = require('path');
const { testCases: postCreateEntity } = require('./testCases-POST-Create-Entity');
const { testCases: postUpdateEntity } = require('./testCases-POST-Update-Entity');
const { testCases: getEntityExistsId } = require('./testCases-GET-Entity-Exists-Id');
const { testCases: postEntityExists } = require('./testCases-POST-Entity-Exists');
const { testCases: getEntityId } = require('./testCases-GET-Entity-Id');
const { testCases: getEntityAll } = require('./testCases-GET-Entity-All');
const { testCases: postEntityByParams } = require('./testCases-POST-Entity-ByParams');
const { testCases: postEntityCount } = require('./testCases-POST-Entity-Count');
const { testCases: deleteEntityId } = require('./testCases-DELETE-Entity-ById');
const { testCases: othersCases } = require('./testCases-Others');

const testCaseGroups = [
    { name: 'Create Entity POST API', testCases: postCreateEntity },
    { name: 'Update Entity POST API', testCases: postUpdateEntity },
    { name: 'Exists Entity GET API', testCases: getEntityExistsId },
    { name: 'Exists Entity POST API', testCases: postEntityExists },
    { name: 'Get Entity By Id GET API', testCases: getEntityId },
    { name: 'Get All Entity GET API', testCases: getEntityAll },
    { name: 'Get All Entity By Params POST API', testCases: postEntityByParams },
    { name: 'Entity Count POST API', testCases: postEntityCount },
    { name: 'Delete Entity By Id DELETE API', testCases: deleteEntityId },
    { name: 'Others', testCases: othersCases },
];

const addGroupNameToTestCases = (groupName, testCases) => {
    return testCases.map(testCase => ({ ...testCase, groupName }));
};

class CSVReporter {
    constructor(globalConfig, options) {
        this._globalConfig = globalConfig;
        this._options = options;
        this._results = [];
    }

    onTestResult(test, testResult, aggregatedResult) {
        testResult.testResults.forEach((result) => {
            const matchingTestCase = testCaseGroups
                .flatMap((group) => group.testCases.map(testCase => ({ ...testCase, groupName: group.name })))
                .find((testCase) => {
                    const testCaseDescription = `${result.ancestorTitles.join(' ')} ${result.title}`;
                    const fullName = `API Tests ${testCase.groupName} ${testCase.description}`;
                    console.log (testCaseDescription, fullName);
                    return testCaseDescription === fullName;
                });
            const category = matchingTestCase ? matchingTestCase.category : 'N/A';
            const method = matchingTestCase ? matchingTestCase.method : 'N/A';
            const url = matchingTestCase ? matchingTestCase.url : 'N/A';
            const urlParsed = matchingTestCase ? matchingTestCase.url.replace('{entity}', matchingTestCase.entity).replace('{id}', matchingTestCase.id) : 'N/A';

            // Extract only the message from the error
            const errorMessage = result.failureMessages.length > 0 ? result.failureMessages.map((msg) => msg.split('\n')[0]).join('; ') : '';

            this._results.push({
                testCase: result.fullName,
                category: category,
                method: method,
                url: url,
                urlParsed: urlParsed,
                status: result.status,
                errorMessage: errorMessage,
                executionTime: result.duration,
            });
        });
    }

    onRunComplete(contexts, results) {
        const csvData = [
            ['URL', 'Method', 'Test Case', 'Category', 'URL used', 'Status', 'Error Message', 'Execution Time'],
            ...this._results.map((result) => [
                result.url,
                result.method,
                `"${result.testCase.replace(/"/g, '""')}"`,
                result.category,
                result.urlParsed,
                result.status,
                `"${result.errorMessage.replace(/"/g, '""')}"`,
                result.executionTime,
            ]),
        ]
            .map((row) => row.join(','))
            .join('\n');

        fs.writeFileSync(path.join(__dirname, 'testResults.csv'), csvData);
    }
}

module.exports = CSVReporter;
