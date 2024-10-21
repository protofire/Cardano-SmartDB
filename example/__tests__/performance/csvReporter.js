const fs = require('fs');
const path = require('path');

const { testCases : getEntityAllSituations }= require ('./testCases-POST-ALL-Situations.js');
const { testCases : performanceComparison }= require ('./testCases-POST-Optimized-Entity-Comparison.js');


const testCaseGroups = [
    { name:  '#01 Get All case of use', testCases: getEntityAllSituations },
    { name:  '#02 Get All case of use', testCases: getEntityAllSituations },
    { name:  '#03 Get All case of use', testCases: getEntityAllSituations },
    { name:  '#04 Get All case of use', testCases: getEntityAllSituations },
    { name:  '#05 Get All case of use', testCases: getEntityAllSituations },
    { name:  '#06 Get All case of use', testCases: getEntityAllSituations },
    { name:  '#07 Get All case of use', testCases: getEntityAllSituations },
    { name:  '#08 Get All case of use', testCases: getEntityAllSituations },
    { name:  '#09 Get All case of use', testCases: getEntityAllSituations },
    { name:  '#10 Get All case of use', testCases: getEntityAllSituations },

    { name: '#01 Comparison Between Optimized and Not Optimized Entity Filtering by Name', testCases: performanceComparison },
    { name: '#02 Comparison Between Optimized and Not Optimized Entity Filtering by Name', testCases: performanceComparison },
    { name: '#03 Comparison Between Optimized and Not Optimized Entity Filtering by Name', testCases: performanceComparison },
    { name: '#04 Comparison Between Optimized and Not Optimized Entity Filtering by Name', testCases: performanceComparison },
    { name: '#05 Comparison Between Optimized and Not Optimized Entity Filtering by Name', testCases: performanceComparison },
    { name: '#06 Comparison Between Optimized and Not Optimized Entity Filtering by Name', testCases: performanceComparison },
    { name: '#07 Comparison Between Optimized and Not Optimized Entity Filtering by Name', testCases: performanceComparison },
    { name: '#08 Comparison Between Optimized and Not Optimized Entity Filtering by Name', testCases: performanceComparison },
    { name: '#09 Comparison Between Optimized and Not Optimized Entity Filtering by Name', testCases: performanceComparison },
    { name: '#10 Comparison Between Optimized and Not Optimized Entity Filtering by Name', testCases: performanceComparison }
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
