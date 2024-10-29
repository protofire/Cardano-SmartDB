# Testing the Smart DB Library Example

## Table of Contents
- [Testing the Smart DB Library Example](#testing-the-smart-db-library-example)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [API Tests](#api-tests)
    - [Running API Tests](#running-api-tests)
    - [API Test Results](#api-test-results)
  - [Concurrency Tests](#concurrency-tests)
    - [Test Structure](#test-structure)
    - [Test Environment Setup](#test-environment-setup)
      - [Prerequisites](#prerequisites)
      - [Configuration](#configuration)
      - [Understanding Test Parameters](#understanding-test-parameters)
    - [Running Concurrency Tests](#running-concurrency-tests)
    - [Test Results](#test-results)
      - [Test Results Explanation](#test-results-explanation)
      - [Smart Selection Comparison Explanation](#smart-selection-comparison-explanation)
      - [Key Performance Indicators](#key-performance-indicators)
    - [Interpreting the Provided Results](#interpreting-the-provided-results)
      - [Impact of Smart Selection](#impact-of-smart-selection)
      - [Concurrency Factor Analysis](#concurrency-factor-analysis)
      - [UTXO to User Ratio Effects](#utxo-to-user-ratio-effects)
      - [Read UTXO Impact](#read-utxo-impact)
      - [Conclusion](#conclusion)
  - [Performance Tests](#performance-tests)
    - [Running Performance Tests](#running-performance-tests)
    - [Test Structure](#test-structure-1)
    - [Test Results](#test-results-1)

## Introduction

This document provides a comprehensive guide to the testing suites developed for the Smart DB Library example. The suite includes:
- API tests to verify endpoint functionality
- Concurrency tests to evaluate Smart UTXO and Smart Selection systems
- Performance tests to measure optimization impacts on database operations

## API Tests

The API tests cover all non-transaction API endpoints, ensuring that they respond correctly and behave as expected. These tests are implemented using Jest and can be found in the `__tests__/api/` directory.

### Running API Tests

Execute the following command to run the API tests:

```
npm run test-api
```

This command will execute all API tests and provide a summary of the results.

### API Test Results

Test results are saved in the `__tests__/api/testResults.csv` file. This CSV file contains detailed information about each API test case, including:

- Endpoint tested
- HTTP method
- Expected status code
- Actual status code
- Test result (Pass/Fail)
- Any error messages or additional notes

## Concurrency Tests

The concurrency tests are designed to evaluate the performance of the Smart UTXO and Smart Selection systems under various concurrent transaction scenarios. These tests simulate multiple users performing transactions simultaneously, with different configurations of UTXOs, transaction types, and selection strategies.

### Test Structure

The concurrency tests are implemented in the `main.test.ts` file. 
Key components include:

- `beforeAll`: Sets up the master wallet and creates user wallets.
- `beforeEach`: Prepares the correct number of UTXOs for each test case.
- Individual test cases: Run for different combinations of users, transactions, and Smart Selection settings.

1. **Wallet Preparation**: The test suite sets up multiple wallets based on the number of simulated users. It uses a master wallet (configured with a private key in the test configuration) to fund these wallets with ADA and collateral UTXOs.

2. **UTXO Management**: Before each test case, the system ensures that the correct number of Free Entity UTXOs exists in the contract. It will create or delete UTXOs as necessary to match the test requirements.

3. **Test cases**: Defined in the `TEST_CASES` array within the `CONFIG` object. Each test case specifies:
   - Number of UTXOs available
   - Number of concurrent users
   - Number of transactions per user

The tests are run with various combinations of:
- Smart Selection: On/Off
- Read UTXOs: Included/Not included

### Test Environment Setup

#### Prerequisites

Before running the tests, ensure you have:
1. A funded master wallet on the Cardano testnet
2. [Optional] Previously generated wallet private keys for consistent testing

#### Configuration

1. Open the `main.test.ts` file located in the `__tests__` directory.
2. Locate the `CONFIG` object (around line 15):
```typescript
export const CONFIG = {
    MASTER_WALLET_PRIVATE_KEY: 'ed25519_sk18d89yc42qvu2tmpfjsjjgf8r9rhas0kku3f32maae73x2va5thfsvlntdt',
    USERS_WALLETS_PRIVATE_KEYS: [
        'ed25519_sk1dp6ympdrep6za5meluh56c8zv480ju5ckw4rd8ymlnf8ev4jmthq45gkh8',
        // ... (more keys)
    ],
    TX_FEE: 1000000,
    SAFETY_MARGIN: 1.5,
    TEST_CASES: [
        { utxos: 2, users: [1, 2, 4], transactionsPerUser: [1, 2] },
        { utxos: 5, users: [2, 5, 10], transactionsPerUser: [1, 2, 4] },
        { utxos: 10, users: [5, 10, 20], transactionsPerUser: [1, 2, 4, 8] },
    ],
    INITIAL_DELAY_BETWEEN_USERS: 500,
    DELAY_BETWEEN_TXS: 3000,
    MAX_RETRIES_TX: 3,
    RETRY_DELAY_TX: 3000,
    REQUIRED_UTXOS: 5,
    COLLATERAL_UTXO_VALUE: 5000000n,
    MAX_RETRIES_SETUP: 3,
    RETRY_DELAY_SETUP: 3000,
};
```

1. Update the `MASTER_WALLET_PRIVATE_KEY` with your funded master wallet's private key.
2. If you have previously generated wallet keys, update the `USERS_WALLETS_PRIVATE_KEYS` array.
3. Adjust Test Cases as desired, including:
   - Number of UTXOs
   - Number of concurrent users
   - Transactions per user
4. Adjust other parameters as needed for your testing environment. 

#### Understanding Test Parameters
- `INITIAL_DELAY_BETWEEN_USERS`: Time delay between starting transactions for each user (ms)
- `DELAY_BETWEEN_TXS`: Time delay between transactions for the same user (ms)
- `MAX_RETRIES_TX`: Maximum number of retry attempts for a failed transaction
- `RETRY_DELAY_TX`: Time delay between transaction retry attempts (ms)
- `REQUIRED_UTXOS`: Minimum number of UTXOs required for each wallet
- `COLLATERAL_UTXO_VALUE`: Value of collateral UTXOs in lovelace

For a detailed explanation of all configuration parameters and how to modify them for your specific testing needs, refer to the `CONFIG` object in the `main.test.ts` file. Adjusting these parameters allows for fine-tuning the test scenarios to match various real-world conditions or to stress-test the system under extreme circumstances.

### Running Concurrency Tests

To execute the concurrency tests, run:

```
npm run test-concurrency
```

This command will execute the concurrency test suite, simulating various scenarios and collecting performance data.

Note: These tests are extensive and may take several hours to complete. In the provided example, the total runtime was approximately 17,385 seconds (about 4.8 hours).

### Test Results

The test results are saved in an Excel file `__tests__/concurrency/test_results.xlsx` with two sheets:
1. `Test Results`: Contains detailed results for each individual test run.
2. `Smart Selection Comparison`: Provides a comparative analysis of Smart Selection On vs. Off for each test case.

#### Test Results Explanation

The `Test Results` sheet includes the following columns:

- UTXOs: Number of UTXOs available for the test
- Users: Number of concurrent users
- Transactions per User: Number of transactions each user attempts
- Smart Selection: Whether Smart Selection was enabled (On/Off)
- With Reference Read: Whether read UTXOs were included in transactions (On/Off)
- Total Transactions: Total number of transactions attempted (Users * Transactions per User)
- Concurrency Factor: (Users * Transactions per User * (Read ? 2 : 1)) / UTXOs
- Successful Transactions: Number of transactions that completed successfully
- Failed Transactions: Number of transactions that failed
- Success Rate: Percentage of successful transactions
- Total Attempts: Total number of transaction attempts (including retries)
- Avg Attempts per Tx: Average number of attempts per transaction
- Total Time (s): Total time taken for all transactions
- Avg Time per Tx (s): Average time per transaction
- Avg Time per Successful Tx (s): Average time for successful transactions
- Avg Time per Attempted Tx (s): Average time per transaction attempt
- Efficiency Rate: Percentage of successful transactions out of total attempts
- Pass: Whether the test case passed based on predefined criteria (Yes/No)

#### Smart Selection Comparison Explanation

The `Smart Selection Comparison` sheet provides a comparative analysis between Smart Selection On and Off for each test case. It includes:

- All relevant test parameters (UTXOs, Users, Transactions per User, etc.)
- Success Rate comparison (Smart On vs. Smart Off)
- Success Rate Improvement percentage
- Average Attempts comparison
- Attempt Reduction percentage
- Various time metrics comparisons
- Efficiency Rate comparison
- Overall Improvement assessment

#### Key Performance Indicators

When analyzing the results, pay special attention to:

1. Success Rate Improvement: Indicates how much Smart Selection improves transaction success rates.
2. Attempt Reduction: Shows the reduction in transaction attempts when using Smart Selection.
3. Time Improvement: Demonstrates the time savings achieved with Smart Selection.
4. Efficiency Improvement: Illustrates the overall efficiency gain with Smart Selection.
5. How the Concurrency Factor (calculated as `(users * transactionsPerUser * (read ? 2 : 1)) / utxos`) affects performance.
6. The system's behavior when the number of users exceeds the number of available UTXOs.
7. The effect of including both read and consume UTXOs in transactions.

### Interpreting the Provided Results 

The following interpretation is based on the test results provided in `tests/concurrency/provided_test_results.xlsx`. This file contains the benchmark results used for this analysis and will not be overwritten by subsequent user tests.

#### Impact of Smart Selection

Smart Selection shows significant improvements across various metrics:

1. Higher Success Rates: With Smart Selection On, success rates are consistently higher. For instance, in a scenario with 5 UTXOs, 5 users, and 2 transactions per user, the success rate improved from 20% to 100% with Smart Selection On.
2. Fewer Attempts: Smart Selection reduces the number of attempts required per transaction. In the same scenario, the average attempts decreased from 2.60 to 1.10 with Smart Selection On.
3. Time Efficiency: Many test cases show improved average transaction times. For example, with 10 UTXOs, 10 users, and 4 transactions per user, the average time per successful transaction reduced from 78.05s to 7.57s with Smart Selection On.
4. Overall Efficiency: The Efficiency Rate is consistently higher with Smart Selection. In the previous example, it increased from 2.59% to 88.89%.

#### Concurrency Factor Analysis

The Concurrency Factor (CF) provides insight into the level of contention for UTXOs:

- Low CF (<1): For instance, with 5 UTXOs, 2 users, and 1 transaction each (CF = 0.40), both systems achieve 100% success rate.
- Medium CF (1-5): Smart Selection starts to show significant benefits. For example, with 5 UTXOs, 5 users, and 2 transactions each (CF = 2.00), Smart Selection improved success rate from 20% to 100%.
- High CF (>5): Smart Selection becomes crucial. In a scenario with 10 UTXOs, 20 users, and 8 transactions each (CF = 16.00), Smart Selection maintained a 42.50% success rate compared to 3.13% without it.

#### UTXO to User Ratio Effects

- When UTXOs ≥ Users: Both systems perform well, but Smart Selection still shows improvements. For example, with 10 UTXOs and 5 users doing 4 transactions each, Smart Selection achieved 100% success rate compared to 15% without it.
- When UTXOs < Users: Smart Selection demonstrates its strength. In a case with 5 UTXOs and 10 users doing 2 transactions each, Smart Selection maintained a 50% success rate compared to 10% without it.

#### Read UTXO Impact

Including read UTXOs in transactions (With Reference Read: On) generally:

- Increases the Concurrency Factor
- Can lead to lower success rates in some scenarios

For instance, with 10 UTXOs, 20 users, and 4 transactions each, enabling read UTXOs reduced the success rate from 48.75% to 42.50% even with Smart Selection On.

#### Conclusion

The comprehensive test results demonstrate that the Smart Selection system significantly improves the performance and reliability of concurrent transactions on the Cardano blockchain, especially in high-contention scenarios. Key findings include:

1. Consistent Improvement: Smart Selection outperforms traditional UTXO management in 98% of the test cases.
2. Scalability: As the user-to-UTXO ratio increases, Smart Selection's benefits become more pronounced. For example, with 10 UTXOs and 20 users, Smart Selection improved success rates by up to 39.38%.
3. Efficiency Gains: Smart Selection reduces transaction attempts by an average of 40.56% across all test cases.
4. Time Savings: In many scenarios, Smart Selection leads to faster average transaction times, with improvements of up to 90.31% observed.
5. Robustness: Smart Selection maintains higher success rates even in challenging high-concurrency environments, showing up to 93.75% improvement in some cases.

These results validate the effectiveness of the Smart UTXO and Smart Selection systems in managing concurrent transactions, particularly in scenarios where traditional UTXO management would struggle. The system shows great promise for improving the scalability and user experience of dApps on the Cardano blockchain.

## Performance Tests

The performance tests are designed to evaluate the impact of database optimizations through comparison testing of optimized and non-optimized entity implementations.

### Running Performance Tests

Execute the following command to run the performance tests:

```
npm run test-performance
```

The tests generate detailed comparison results between optimized and non-optimized database operations.

### Test Structure

The tests in `__tests__/performance/main.test.ts` compare two implementations:

1. ProductOpt: Entity with optimizations
   - Strategic field indexing
   - Composite indexes for common queries
   - Optimized field selection

2. ProductNoOpt: Base implementation without optimizations

Test scenarios cover:
- Complete vs selective field retrieval
- Pagination testing
- Sort operations
- Index utilization

Results are stored in:
- `__tests__/performance/testResults.csv`: Raw test execution data
- `__tests__/performance/Performance_Measure.xlsx`:
  - Sheet 1: "Get All Situations" comparing retrieval methods
  - Sheet 2: "Comparison of Performance" analyzing optimization impact

### Test Results

Our testing shows significant improvements through optimization:

Query Optimization Results:
- Selected field retrieval: 53.97% faster responses
- Limited queries: 192.80% performance improvement
- Sorted queries: Maintained consistent performance

Database Optimization Impact:
- Single field indexed queries: 15.74% faster
- Composite index queries: 5.66% faster

Key Findings:
- Field selection provides the most significant performance gains
- Pagination dramatically improves response times for large datasets
- Indexes show notable improvements for filtered queries
- Composite indexes provide moderate but consistent improvements