import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export function saveExcel(results, filePath, filename) {
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

export function generateSpreadsheet(results, filename) {
    const wb = XLSX.utils.book_new();

    // Combined Detailed Results and Summary
    const combinedResults = results.map((r) => ({
        UTXOs: r.utxos,
        Users: r.users,
        'Transactions per User': r.transactionsPerUser,
        'Smart Selection': r.smartSelection ? 'On' : 'Off',
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

export function compareSmartSelection(results) {
    const comparison = [];

    if (results.length % 2 !== 0) {
        console.warn('[WARNING] Odd number of results. The last result will be ignored in the comparison.');
    }

    for (let i = 0; i < results.length - 1; i += 2) {
        const withSmart = results[i];
        const withoutSmart = results[i + 1];
        // Verificar si los pares de resultados son comparables
        if (withSmart.utxos !== withoutSmart.utxos || withSmart.users !== withoutSmart.users || withSmart.transactionsPerUser !== withoutSmart.transactionsPerUser) {
            console.error(`[ERROR] Mismatched test cases at index ${i} and ${i + 1}. Skipping this comparison.`);
            continue;
        }
        if (!withSmart.smartSelection || withoutSmart.smartSelection) {
            console.error(`[ERROR] Incorrect smart selection configuration at index ${i} and ${i + 1}. Skipping this comparison.`);
            continue;
        }
        const totalTx = withSmart.users * withSmart.transactionsPerUser;
        // Función auxiliar para manejar divisiones por cero
        const safeDivide = (a, b) => (b === 0 ? 0 : a / b);
        comparison.push({
            UTXOs: withSmart.utxos,
            Users: withSmart.users,
            'Transactions per User': withSmart.transactionsPerUser,
            'Total Transactions': totalTx,
            'Concurrency Factor': safeDivide(withSmart.users * withSmart.transactionsPerUser, withSmart.utxos).toFixed(2),
            'Success Rate (Smart On)': `${(safeDivide(withSmart.successful, totalTx) * 100).toFixed(2)}%`,
            'Success Rate (Smart Off)': `${(safeDivide(withoutSmart.successful, totalTx) * 100).toFixed(2)}%`,
            'Success Rate Improvement': `${((safeDivide(withSmart.successful, totalTx) - safeDivide(withoutSmart.successful, totalTx)) * 100).toFixed(2)}%`,
            'Avg Attempts (Smart On)': safeDivide(withSmart.totalAttempts, totalTx).toFixed(2),
            'Avg Attempts (Smart Off)': safeDivide(withoutSmart.totalAttempts, totalTx).toFixed(2),
            'Attempt Reduction': `${((1 - safeDivide(withSmart.totalAttempts, withoutSmart.totalAttempts)) * 100).toFixed(2)}%`,
            'Avg Time per Tx (Smart On) (s)': (withSmart.averageTimePerTx / 1000).toFixed(2),
            'Avg Time per Tx (Smart Off) (s)': (withoutSmart.averageTimePerTx / 1000).toFixed(2),
            'Avg Time per Successful Tx (Smart On) (s)': (withSmart.averageTimePerSuccessfulTx / 1000).toFixed(2),
            'Avg Time per Successful Tx (Smart Off) (s)': (withoutSmart.averageTimePerSuccessfulTx / 1000).toFixed(2),
            'Avg Time per Attempted Tx (Smart On) (s)': (withSmart.averageTimePerAttemptedTx / 1000).toFixed(2),
            'Avg Time per Attempted Tx (Smart Off) (s)': (withoutSmart.averageTimePerAttemptedTx / 1000).toFixed(2),
            'Time Improvement': `${((1 - safeDivide(withSmart.averageTimePerSuccessfulTx, withoutSmart.averageTimePerSuccessfulTx)) * 100).toFixed(2)}%`,
            'Efficiency Rate (Smart On)': `${(safeDivide(withSmart.successful, withSmart.totalAttempts) * 100).toFixed(2)}%`,
            'Efficiency Rate (Smart Off)': `${(safeDivide(withoutSmart.successful, withoutSmart.totalAttempts) * 100).toFixed(2)}%`,
            'Efficiency Improvement': `${(
                (safeDivide(withSmart.successful, withSmart.totalAttempts) - safeDivide(withoutSmart.successful, withoutSmart.totalAttempts)) *
                100
            ).toFixed(2)}%`,
            'Overall Improvement':
                withSmart.pass && !withoutSmart.pass
                    ? 'Significant'
                    : !withSmart.pass && withoutSmart.pass
                    ? 'Negative'
                    : withSmart.successful > withoutSmart.successful
                    ? 'Positive'
                    : withSmart.successful < withoutSmart.successful
                    ? 'Negative'
                    : 'Neutral',
        });
    }
    return comparison;
}
