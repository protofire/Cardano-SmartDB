import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// export interface TestResult {
//     utxos: number;
//     users: number;
//     transactionsPerUser: number;
//     smartSelection: boolean;
//     read: boolean;
//     successful: number;
//     failed: number;
//     totalAttempts: number;
//     totalTime: number;
//     averageTimePerTx: number;
//     averageTimePerSuccessfulTx: number;
//     averageTimePerAttemptedTx: number;
//     pass: boolean;
// }

export function saveExcel(results, filePath, filename) {
    // export function saveExcel(results: TestResult[], filePath: string, filename: string) {
    const spreadsheetPath = path.join(filePath, `${filename}.xlsx`);
    const backupPath = path.join(filePath, `${filename}.backup.xlsx`);
    // Si existe un archivo previo, créale una copia de seguridad
    if (fs.existsSync(spreadsheetPath)) {
        fs.copyFileSync(spreadsheetPath, backupPath);
        console.log(`[TEST] - Backup created: ${backupPath}`);
    }
    try {
        generateSpreadsheet(results, spreadsheetPath);
        console.log(`[TEST] - Excel file updated: ${spreadsheetPath}`);
        // Si la escritura fue exitosa y existe un backup, lo eliminamos
        // if (fs.existsSync(backupPath)) {
        //     fs.unlinkSync(backupPath);
        //     console.log(`[TEST] - Backup removed after successful update`);
        // }
    } catch (error) {
        console.error(`[TEST] - Error updating Excel file: ${JSON.stringify(error)}`);
        if (fs.existsSync(backupPath)) {
            // Si hubo un error y existe un backup, lo restauramos
            fs.copyFileSync(backupPath, spreadsheetPath);
            console.log(`[TEST] - Previous version restored from backup`);
        }
    }
}

// export function generateSpreadsheet(results: TestResult[], filename: string): void {
export function generateSpreadsheet(results, filename) {
    const wb = XLSX.utils.book_new();

    // Combined Detailed Results and Summary
    const combinedResults = results.map((r) => ({
        UTXOs: r.utxos,
        Users: r.users,
        'Transactions per User': r.transactionsPerUser,
        'Smart Selection': r.smartSelection ? 'On' : 'Off',
        'With Reference Read': r.read ? 'On' : 'Off', // Add this new field
        'Total Transactions': r.users * r.transactionsPerUser,
        'Concurrency Factor': (r.users * r.transactionsPerUser / r.utxos).toFixed(2),
        'Successful Transactions': r.successful,
        'Failed Transactions': r.failed,
        'Success Rate': `${((r.successful / (r.users * r.transactionsPerUser)) * 100).toFixed(2)}%`,
        'Total Attempts': r.totalAttempts,
        'Avg Attempts per Tx': (r.totalAttempts / (r.users * r.transactionsPerUser)).toFixed(2),
        'Total Time (s)': (r.totalTime / 1000).toFixed(2),
        'Avg Time per Tx (s)': (r.averageTimePerTx / 1000).toFixed(2),
        'Avg Time per Successful Tx (s)': (r.averageTimePerSuccessfulTx / 1000).toFixed(2),
        'Avg Time per Attempted Tx (s)': (r.averageTimePerAttemptedTx / 1000).toFixed(2),
        'Efficiency Rate': `${((r.successful / r.totalAttempts) * 100).toFixed(2)}%`,
        Pass: r.pass ? 'Yes' : 'No',
    }));
    const ws1 = XLSX.utils.json_to_sheet(combinedResults);
    XLSX.utils.book_append_sheet(wb, ws1, 'Test Results');

    // Smart Selection Comparison
    const comparison = compareSmartSelection(results);
    const ws2 = XLSX.utils.json_to_sheet(comparison);
    XLSX.utils.book_append_sheet(wb, ws2, 'Smart Selection Comparison');

    // Apply styles to all sheets
    ['Test Results', 'Smart Selection Comparison'].forEach((sheetName) => {
        const ws = wb.Sheets[sheetName];
        if (ws) {
            // Set column widths
            ws['!cols'] = Array(20).fill({ wch: 22 });

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

            // Apply number format to numeric cells and center-align text cells
            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const address = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[address]) continue;
                    const cell = ws[address];
                    if (typeof cell.v === 'number') {
                        cell.z = '#,##0.00';
                        cell.s = { alignment: { horizontal: 'right' } };
                    } else if (typeof cell.v === 'string' && cell.v.endsWith('%')) {
                        cell.z = '0.00%';
                        cell.s = { alignment: { horizontal: 'right' } };
                    } else {
                        cell.s = { alignment: { horizontal: 'center' } };
                    }
                }
            }
        }
    });

    XLSX.writeFile(wb, filename);
}

// export function compareSmartSelection(results: TestResult[]): any[] {
export function compareSmartSelection(results) {
    const comparison = [];
    if (results.length % 4 !== 0) {
        console.warn('[WARNING] Number of results is not a multiple of 4. Some results may be ignored in the comparison.');
    }
    for (let i = 0; i < results.length - 3; i += 4) {
        const smartOnReadOff = results[i];
        const smartOffReadOff = results[i + 1];
        const smartOnReadOn = results[i + 2];
        const smartOffReadOn = results[i + 3];
        // Verificar si los pares de resultados son comparables
        if (!areComparable([smartOnReadOff, smartOffReadOff, smartOnReadOn, smartOffReadOn])) {
            console.error(`[ERROR] Mismatched test cases at index ${i}. Skipping this comparison.`);
            continue;
        }
        const totalTx = smartOnReadOff.users * smartOnReadOff.transactionsPerUser;
        // Compare Smart On vs Off with Read Off
        comparison.push(createComparisonRow(smartOnReadOff, smartOffReadOff, totalTx, 'Off'));
        // Compare Smart On vs Off with Read On
        comparison.push(createComparisonRow(smartOnReadOn, smartOffReadOn, totalTx, 'On'));
        
    }
    return comparison;
}

// function areComparable(results: TestResult[]): boolean {
function areComparable(results) {
    const [first, ...rest] = results;
    return rest.every(r => 
        r.utxos === first.utxos && 
        r.users === first.users && 
        r.transactionsPerUser === first.transactionsPerUser
    );
}

// function createComparisonRow(smartOn: TestResult, smartOff: TestResult, totalTx: number, readState: string): any {
    function createComparisonRow(smartOn, smartOff, totalTx, readState) {
    // Helper function to safely divide
    // const safeDivide = (a: number, b: number) => (b === 0 ? 0 : a / b);
    const safeDivide = (a, b) => (b === 0 ? 0 : a / b);
    return {
        UTXOs: smartOn.utxos,
        Users: smartOn.users,
        'Transactioddns per User': smartOn.transactionsPerUser,
        'Total Transactions': totalTx,
        'Concurrency Factor': safeDivide(smartOn.users * smartOn.transactionsPerUser, smartOn.utxos).toFixed(2),
        'With Reference Read': readState,
        'Success Rate (Smart On)': `${(safeDivide(smartOn.successful, totalTx) * 100).toFixed(2)}%`,
        'Success Rate (Smart Off)': `${(safeDivide(smartOff.successful, totalTx) * 100).toFixed(2)}%`,
        'Success Rate Improvement': `${((safeDivide(smartOn.successful, totalTx) - safeDivide(smartOff.successful, totalTx)) * 100).toFixed(2)}%`,
        'Avg Attempts (Smart On)': safeDivide(smartOn.totalAttempts, totalTx).toFixed(2),
        'Avg Attempts (Smart Off)': safeDivide(smartOff.totalAttempts, totalTx).toFixed(2),
        'Attempt Reduction': `${((1 - safeDivide(smartOn.totalAttempts, smartOff.totalAttempts)) * 100).toFixed(2)}%`,
        'Avg Time per Tx (Smart On) (s)': (smartOn.averageTimePerTx / 1000).toFixed(2),
        'Avg Time per Tx (Smart Off) (s)': (smartOff.averageTimePerTx / 1000).toFixed(2),
        'Avg Time per Successful Tx (Smart On) (s)': (smartOn.averageTimePerSuccessfulTx / 1000).toFixed(2),
        'Avg Time per Successful Tx (Smart Off) (s)': (smartOff.averageTimePerSuccessfulTx / 1000).toFixed(2),
        'Avg Time per Attempted Tx (Smart On) (s)': (smartOn.averageTimePerAttemptedTx / 1000).toFixed(2),
        'Avg Time per Attempted Tx (Smart Off) (s)': (smartOff.averageTimePerAttemptedTx / 1000).toFixed(2),
        'Time Improvement': `${((1 - safeDivide(smartOn.averageTimePerSuccessfulTx, smartOff.averageTimePerSuccessfulTx)) * 100).toFixed(2)}%`,
        'Efficiency Rate (Smart On)': `${(safeDivide(smartOn.successful, smartOn.totalAttempts) * 100).toFixed(2)}%`,
        'Efficiency Rate (Smart Off)': `${(safeDivide(smartOff.successful, smartOff.totalAttempts) * 100).toFixed(2)}%`,
        'Efficiency Improvement': `${((safeDivide(smartOn.successful, smartOn.totalAttempts) - safeDivide(smartOff.successful, smartOff.totalAttempts)) * 100).toFixed(2)}%`,
        'Overall Improvement':
            smartOn.pass && !smartOff.pass
                ? 'Significant'
                : !smartOn.pass && smartOff.pass
                ? 'Negative'
                : smartOn.successful > smartOff.successful
                ? 'Positive'
                : smartOn.successful < smartOff.successful
                ? 'Negative'
                : 'Neutral',
    };
}