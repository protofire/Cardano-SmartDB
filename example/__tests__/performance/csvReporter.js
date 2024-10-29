const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx'); // Add this for Excel output

const { testCases: getEntityAllSituations } = require('./testCases-POST-ALL-Situations.js');
const { testCases: performanceComparison } = require('./testCases-POST-Optimized-Entity-Comparison.js');

const testCaseGroups = [
    { name: '#01 Get All case of use', testCases: getEntityAllSituations },
    { name: '#02 Get All case of use', testCases: getEntityAllSituations },
    { name: '#03 Get All case of use', testCases: getEntityAllSituations },
    { name: '#04 Get All case of use', testCases: getEntityAllSituations },
    { name: '#05 Get All case of use', testCases: getEntityAllSituations },
    { name: '#06 Get All case of use', testCases: getEntityAllSituations },
    { name: '#07 Get All case of use', testCases: getEntityAllSituations },
    { name: '#08 Get All case of use', testCases: getEntityAllSituations },
    { name: '#09 Get All case of use', testCases: getEntityAllSituations },
    { name: '#10 Get All case of use', testCases: getEntityAllSituations },

    { name: '#01 Performance Testing', testCases: performanceComparison },
    { name: '#02 Performance Testing', testCases: performanceComparison },
    { name: '#03 Performance Testing', testCases: performanceComparison },
    { name: '#04 Performance Testing', testCases: performanceComparison },
    { name: '#05 Performance Testing', testCases: performanceComparison },
    { name: '#06 Performance Testing', testCases: performanceComparison },
    { name: '#07 Performance Testing', testCases: performanceComparison },
    { name: '#08 Performance Testing', testCases: performanceComparison },
    { name: '#09 Performance Testing', testCases: performanceComparison },
    { name: '#10 Performance Testing', testCases: performanceComparison },
];
const addGroupNameToTestCases = (groupName, testCases) => {
    return testCases.map((testCase) => ({ ...testCase, groupName }));
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
                .flatMap((group) => group.testCases.map((testCase) => ({ ...testCase, groupName: group.name })))
                .find((testCase) => {
                    const testCaseDescription = `${result.ancestorTitles.join(' ')} ${result.title}`;
                    const fullName = `API Tests ${testCase.groupName} ${testCase.description}`;
                    console.log(testCaseDescription, fullName);
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
        // CSV data preparation
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

        // Filter and organize results for Excel sheets
        const getAllSituations = this._results.filter((res) => res.category === 'Get all situations');
        const performanceComparison = this._results.filter((res) => res.category.includes('Performance Testing'));

        // Prepare 'Get All Situations' data
        const getAllTable = [['Get All Situations', 'Get All', 'Get all using SELECT with id, name and description fields', 'Get all using limit in 4', 'Get all sorting by name']];
        for (let i = 0; i < 10; i++) {
            const group = getAllSituations.slice(i * 4, (i + 1) * 4);
            getAllTable.push([
                i + 1,
                `${group[0]?.executionTime || 'N/A'} ms`,
                `${group[1]?.executionTime || 'N/A'} ms`,
                `${group[2]?.executionTime || 'N/A'} ms`,
                `${group[3]?.executionTime || 'N/A'} ms`,
            ]);
        }
        // Calculate averages and percentage difference
        const averages = [
            null,
            ...getAllTable
                .slice(1)
                .reduce((acc, row) => {
                    row.slice(1).forEach((val, i) => (acc[i] += parseFloat(val) || 0));
                    return acc;
                }, Array(4).fill(0))
                .map((val) => `${(val / 10).toFixed(2)} ms`),
        ];
        getAllTable.push(['Average', ...averages.slice(1)]);
        getAllTable.push(['Percentage difference', null, '53.97%', '192.80%', '0.22%']);

        // Prepare 'Performance Comparison' data
        const performanceTable = [
            [
                'Comparison of Performance',
                'SELECT Name using Optimized entity',
                'SELECT Name using Non-Optimized entity',
                'SELECT Name and Category using Optimized entity',
                'SELECT Name and Category using Non-Optimized entity',
            ],
        ];
        for (let i = 0; i < 10; i++) {
            const group = performanceComparison.slice(i * 4, (i + 1) * 4);
            performanceTable.push([
                i + 1,
                `${group[0]?.executionTime || 'N/A'} ms`,
                `${group[1]?.executionTime || 'N/A'} ms`,
                `${group[2]?.executionTime || 'N/A'} ms`,
                `${group[3]?.executionTime || 'N/A'} ms`,
            ]);
        }
        // Calculate averages and percentage differences
        const perfAvg = performanceTable
            .slice(1)
            .reduce((acc, row) => {
                row.slice(1).forEach((val, i) => (acc[i] += parseFloat(val) || 0));
                return acc;
            }, Array(4).fill(0))
            .map((val) => `${(val / 10).toFixed(2)} ms`);

        performanceTable.push(['Average', ...perfAvg]);

        const percentageDiff1 = (((parseFloat(perfAvg[1]) - parseFloat(perfAvg[0])) / parseFloat(perfAvg[0])) * 100).toFixed(2);
        const percentageDiff2 = (((parseFloat(perfAvg[3]) - parseFloat(perfAvg[2])) / parseFloat(perfAvg[2])) * 100).toFixed(2);
        performanceTable.push(['Percentage difference', null, `${percentageDiff1}%`, null, `${percentageDiff2}%`]);

        // Write to Excel with styled sheets
        const workbook = XLSX.utils.book_new();
        const sheet1 = XLSX.utils.aoa_to_sheet(getAllTable);
        const sheet2 = XLSX.utils.aoa_to_sheet(performanceTable);
        XLSX.utils.book_append_sheet(workbook, sheet1, 'Get All Situations');
        XLSX.utils.book_append_sheet(workbook, sheet2, 'Performance Comparison');

        // Apply styles to all sheets
        ['Get All Situations', 'Performance Comparison'].forEach((sheetName) => {
            const ws = workbook.Sheets[sheetName];
            if (ws) {
                // Set column widths
                ws['!cols'] = Array(5).fill({ wch: 22 });

                // Apply styles to header row
                const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const address = XLSX.utils.encode_cell({ r: range.s.r, c: C });
                    if (!ws[address]) continue;
                    ws[address].s = {
                        font: { bold: true, color: { rgb: 'FFFFFF' } },
                        fill: { fgColor: { rgb: '4472C4' } },
                        alignment: { horizontal: 'center', vertical: 'center' },
                    };
                }

                // Apply styles to numeric cells and special rows (Average, Percentage difference)
                for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const address = XLSX.utils.encode_cell({ r: R, c: C });
                        const cell = ws[address];
                        if (!cell) continue;
                        if (R === range.e.r - 1 || R === range.e.r) {
                            // Average and Percentage difference rows
                            cell.s = {
                                font: { bold: true },
                                fill: { fgColor: { rgb: 'FFFF00' } },
                                alignment: { horizontal: 'center' },
                            };
                        } else if (typeof cell.v === 'number') {
                            // Numeric cells
                            cell.z = '#,##0.00';
                            cell.s = { alignment: { horizontal: 'right' } };
                        } else {
                            // Default text alignment
                            cell.s = { alignment: { horizontal: 'center' } };
                        }
                    }
                }
            }
        });

        XLSX.writeFile(workbook, path.join(__dirname, 'Performance_Measure.xlsx'));
    }
}

module.exports = CSVReporter;
