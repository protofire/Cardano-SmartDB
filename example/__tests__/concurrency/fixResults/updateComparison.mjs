//Update Smart Selection Comparison Script
//Standalone script to update the "Smart Selection Comparison" sheet in the test results Excel file.

import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

import { saveExcel } from './results.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fileNameResults = 'test_results';

function parseTestResult(row) {
    const totalTransactions = parseInt(row['Total Transactions'], 10);
    return {
        utxos: parseInt(row['UTXOs'], 10),
        users: parseInt(row['Users'], 10),
        transactionsPerUser: parseInt(row['Transactions per User'], 10),
        smartSelection: row['Smart Selection'] === 'On',
        successful: parseInt(row['Successful Transactions'], 10),
        failed: parseInt(row['Failed Transactions'], 10),
        totalAttempts: parseInt(row['Total Attempts'], 10),
        totalTime: parseFloat(row['Total Time (s)']) * 1000, // converting seconds back to ms
        averageTimePerTx: parseFloat(row['Avg Time per Tx (s)']) * 1000, // converting seconds back to ms
        averageTimePerSuccessfulTx: parseFloat(row['Avg Time per Successful Tx (s)']) * 1000, // converting seconds back to ms
        averageTimePerAttemptedTx: parseFloat(row['Avg Time per Attempted Tx (s)']) * 1000, // converting seconds back to ms
        pass: row['Pass'] === 'Yes',
    };
}
function updateSmartSelectionComparison() {
    // Read the Excel file
    const spreadsheetPath = path.join(__dirname, `${fileNameResults}.xlsx`);
    console.log(`Updatin "Smart Selection Comparison" sheet: ${spreadsheetPath}`);
    const workbook = XLSX.readFile(spreadsheetPath);
    // Generate the new comparison data
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawResults = XLSX.utils.sheet_to_json(firstSheet);
    // Reverse the process: recreate TestResult objects from the sheet data
    const results = rawResults.map((row) => parseTestResult(row));
    saveExcel(results, __dirname, `${fileNameResults}-updated`);
    console.log(`Updated "Smart Selection Comparison" sheet`);
}

updateSmartSelectionComparison();
