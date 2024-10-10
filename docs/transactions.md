
# Transaction Flow in Smart DB System
## Table of Contents
- [Transaction Flow in Smart DB System](#transaction-flow-in-smart-db-system)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Key Entities](#key-entities)
  - [Transaction Flow](#transaction-flow)
    - [1. User Initiates Transaction](#1-user-initiates-transaction)
    - [2. Backend Transaction Preparation](#2-backend-transaction-preparation)
    - [3. Transaction Construction](#3-transaction-construction)
    - [4. Frontend Signing and Submission](#4-frontend-signing-and-submission)
    - [5. Transaction Monitoring](#5-transaction-monitoring)
    - [6. Post-Confirmation Processing](#6-post-confirmation-processing)
    - [7. Finalization](#7-finalization)
  - [Concurrency Handling](#concurrency-handling)
  - [Error Handling](#error-handling)
  - [Transaction States](#transaction-states)
  - [Synchronization Mechanism](#synchronization-mechanism)
  - [Limitations](#limitations)
  - [Conclusion](#conclusion)
  
## Overview

This document describes the detailed flow of a transaction in the Smart DB system, focusing on the update transaction process for a generic SmartDB entity. It covers the entire process from the user initiating the transaction to the final synchronization of the blockchain state with the internal database.

## Key Entities

1. SmartDBEntity: Represents entities that exist both in the local database and on the Cardano blockchain. It serves as the base class for blockchain-synchronized entities.
2. SmartUTxOEntity: Represents UTxOs in the system, containing detailed information about UTxO location on the blockchain and its current usage state. It includes fields for concurrency management such as isPreparingForReading, isReading, isPreparingForConsuming, and isConsuming.
3. TransactionEntity: Tracks all transactions in the system, managing the transaction lifecycle and status updates. It is crucial for handling concurrency and synchronizing the database state with the blockchain.
   
These entities work together to enable efficient concurrency handling, UTxO management, and blockchain synchronization.

## Transaction Flow

### 1. User Initiates Transaction

The process begins when a user interacts with the frontend application to initiate an update transaction for a SmartDB entity.
1.1. Frontend API Call:
   - The user triggers the update function in the frontend component.
   - The frontend calls the appropriate API endpoint, typically something like `EntityApi.callGenericTxApi_('update-entity-tx', walletTxParams, txParams)`.
     - `'update-entity-tx'` is a specific identifier for the type of transaction being created.
     - `walletTxParams` contains wallet information needed in the backend to construct the transaction.
     - `txParams` includes additional information specific to the transaction the user wants to create.
1.2. API Request Processing:
   - The backend receives the API request.
   - It validates the input parameters and authenticates the user.
  
### 2. Backend Transaction Preparation

2.1. Entity Retrieval:
   - The system retrieves the current state of the SmartDBEntity from the database.
   - It checks if the entity exists and if the user has the right to update it.
     
2.2. UTXO Selection:
   - The system queries available UTXOs (represented by SmartUTxOEntity instances) for the transaction.
   - It applies smart selection logic to choose appropriate UTXOs, considering factors like value and availability.
   - The system distinguishes between UTXOs for reading (reference) and consuming:
     - Reading UTXOs are passed by reference and can be used by multiple transactions simultaneously.
     - Consuming UTXOs will be spent in the transaction and can only be used by one transaction at a time.
       
2.3. UTXO Reservation:
   - Selected UTXOs are marked in the SmartUTxOEntity table based on their intended use:
     - For reading: marked with "isPreparingForReading" timestamp.
     - For consuming: marked with "isPreparingForConsuming" timestamp.
   - This process uses timestamps to manage concurrency and prevent conflicts.
   - UTXOs are available for reading if they are not being prepared for or currently in consumption.
   - UTXOs are available for consumption if they are not being prepared for or currently in reading or consumption.
     
2.4. Transaction Entity Creation:
   - A new TransactionEntity is created in the database with status "CREATED".
   - This entity includes references to the UTXOs being used and other transaction details.
   - The "CREATED" status serves to reserve UTXOs immediately, preventing concurrent selection by other transactions.
  
### 3. Transaction Construction

3.1. Lucid Transaction Builder:
   - The system uses the Lucid library to construct the transaction.
   - It includes necessary inputs, outputs, and the updated entity data in the transaction.
3.2. Script Attachment:
   - Relevant scripts (validator scripts, minting policies) are attached to the transaction.
3.3. Transaction Completion:
   - The transaction is completed and serialized into CBOR format.
   - The TransactionEntity status is updated to "PENDING".
  
### 4. Frontend Signing and Submission

4.1. Return to Frontend:
   - The backend sends the constructed transaction back to the frontend.
4.2. User Signing:
   - The frontend uses Lucid to prompt the user to sign the transaction using their wallet.
4.3. Transaction Submission:
   - Once signed, the frontend uses Lucid to submit the transaction to the blockchain network.
4.4. Update Transaction Status:
   - The frontend calls an API to update the TransactionEntity status to "SUBMITTED".
   - UTXO statuses are updated in the SmartUTxOEntity:
     - Reading UTXOs: "isPreparingForReading" becomes "isReading".
     - Consuming UTXOs: "isPreparingForConsuming" becomes "isConsuming".
  
### 5. Transaction Monitoring

5.1. Status Updater Job:
   - A backend job (TransactionStatusUpdater) periodically checks the status of submitted transactions.
5.2. Blockchain Querying:
   - The job uses Lucid and Blockfrost (or other providers) to query the blockchain and check transaction confirmation status.
5.3. Status Updates:
   - As the transaction progresses, its status in the TransactionEntity is updated (e.g., "PENDING", "SUBMITTED", "CONFIRMED", or "FAILED").
  
### 6. Post-Confirmation Processing

6.1. Confirmation Detection:
   - Once the transaction is confirmed on the blockchain, the status updater job detects this.
6.2. Database Synchronization:
   - The system initiates a sync process for the affected SmartDBEntity.
6.3. SmartDB Entity Update:
   - The corresponding SmartDBEntity in the database is updated to reflect the new state from the blockchain.
6.4. UTXO Management:
   - Used UTXOs are marked as consumed in the SmartUTxOEntity table.
   - New UTXOs created by the transaction are added to the SmartUTxOEntity table.
  
### 7. Finalization

7.1. Transaction Completion:
   - The TransactionEntity status is set to "CONFIRMED".
7.2. Cleanup:
   - Any temporary locks or reservations on UTXOs are cleared in the SmartUTxOEntity table.
7.3. Notification:
   - The system may notify the user of the successful transaction and update.
  
## Concurrency Handling
- UTXO Locking: The system uses timestamps in SmartUTxOEntity (isPreparingForReading, isReading, isPreparingForConsuming, isConsuming) to manage UTXO access, preventing double-spending and read-after-consume scenarios.
- Smart Selection: When multiple transactions compete for UTXOs, the smart selection algorithm prioritizes based on various factors to maximize successful transactions.
- Timeout Mechanism: Transactions that remain in specific states for too long are automatically timed out, releasing reserved UTXOs:
  - TX_PREPARING_TIME (e.g., 3 minutes): Time allowed for transactions to move from "CREATED" or "PENDING" to "SUBMITTED".
  - TX_CONSUMING_TIME (e.g., 6 minutes): Time allowed for "SUBMITTED" transactions to reach confirmation.
  
## Error Handling

- Transaction Failure: If a transaction fails at any stage, the system updates its status in the TransactionEntity accordingly and releases any reserved UTXOs in the SmartUTxOEntity table.
- Retry Mechanism: For certain types of failures (e.g., network issues), the system may attempt to retry the transaction automatically.
- User Feedback: The frontend is updated with transaction status from the TransactionEntity, providing real-time feedback to users.
- Conflict Resolution: In cases of irresolvable concurrency (e.g., more users than available UTXOs), the system provides clear messages to users to retry later.
  
## Transaction States

1. CREATED: Initial state when the TransactionEntity is first created in the database, used to reserve UTXOs.
2. PENDING: Transaction is built and waiting for user signature.
3. PENDING_TIMEOUT: Transaction wasn't signed or submitted within TX_PREPARING_TIME.
4. USER_CANCELED: User explicitly canceled the transaction (e.g., refused to sign).
5. SUBMITTED: Transaction is signed and submitted to the network.
6. CONFIRMED: Transaction is confirmed on the blockchain.
7. FAILED: An error occurred after CREATED or PENDING state.
8. TIMEOUT: Submitted transaction not confirmed within TX_TIMEOUT period.
   
## Synchronization Mechanism

- **Automatic Status Updater**: 

    - The status updater job is automatically initiated whenever a transaction is marked as `SUBMITTED` in the TransactionEntity. 
    - The job continues running as long as there are any transactions in the `SUBMITTED` state.
    - When any transaction moves to the `CONFIRMED` state, the job automatically triggers a synchronization (`sync`) process to update the database with the latest blockchain state.
  
- **Manual Job Initiation**:
  
    - The status updater job can also be started manually if needed, to handle specific situations.
    - Similarly, the synchronization (`sync`) process can be triggered manually if required, to force an immediate update for a SmartDBEntity or TransactionEntity.
  
- **Backend Sync Endpoint**: 

    - The sync process is managed via an endpoint in the backend, which can be called to initiate synchronization. 
    - This is particularly useful if there is a tool or service, such as a webhook that listens to smart contract events or network changes. When these events occur, the tool can call this backend sync endpoint to trigger synchronization immediately, ensuring that the system stays up-to-date with the blockchain state.
  
- **Frontend Behavior**: 
  
    - While these jobs are running on the backend, the user is not required to keep the browser open or actively participate. 
    - All the processes happen entirely on the backend without any frontend involvement. The user is free to close the browser or navigate away.
    - Despite this, the frontend continues to refresh the transaction state periodically, providing the user with real-time updates on the transaction's progress and current status.

- **Job Recovery**: 
    - In the event that the backend job goes down temporarily, it can be restarted to catch up on any transactions that are still in the `SUBMITTED` state. 
    - Once restarted, the job will continue to monitor the blockchain and update the relevant transactions and entities.

This synchronization mechanism ensures that all transactions and entities in the system remain in sync with the blockchain state, and users are always kept informed of the latest status of their transactions. Additionally, the combination of manual and automatic triggers for sync provides flexibility in maintaining data consistency. The system is robust enough to handle temporary backend downtime without losing track of pending transactions, and the separation of concerns between frontend and backend ensures scalability and reliability.

## Limitations

While the Smart DB system provides robust transaction management and concurrency handling, it does have some limitations:
1. High Concurrency Scenarios: In situations with extremely high concurrency (high Concurrency Factor), the system may experience performance degradation. This is particularly noticeable when the number of simultaneous transactions approaches or exceeds the number of available UTXOs.
2. UTXO Scarcity: When the number of users or concurrent transactions significantly exceeds the number of available UTXOs in the contract, it can lead to transaction failures or delays. This limitation is inherent to the UTXO model and can be mitigated to some extent by smart selection, but not entirely eliminated.
3. Perfect Simultaneity Edge Case: There's a rare but possible scenario where two users might call the backend at exactly the same time, both reading the same free UTXOs and attempting to mark them as used simultaneously. In this case, the system might not have enough time to process each execution separately, potentially leading to a race condition. This occurs because the process of reading and writing UTXOs is not atomic. Instead of each transaction reading and writing sequentially, they might interleave.
4. Blockchain Confirmation Times: The system is ultimately dependent on the Cardano blockchain's confirmation times. During periods of network congestion, this could lead to longer wait times for transaction confirmations and subsequent database synchronization.
5. Scalability Constraints: While the system handles concurrency well for moderate loads, there may be scalability challenges when dealing with an extremely large number of simultaneous users or transactions.
6. Complex Error Recovery: In some edge cases, especially those involving multiple failed transactions or system interruptions, manual intervention might be required to reconcile the state between the blockchain and the local database.
   
These limitations are important considerations when implementing and scaling applications built on the Smart DB system. Proper monitoring, load testing, and optimization strategies should be employed to mitigate these issues in production environments.

## Conclusion

This transaction flow demonstrates how the Smart DB system manages complex blockchain interactions while maintaining data integrity and handling concurrency. By using a combination of database entities (TransactionEntity, SmartUTxOEntity) and blockchain interactions, the system provides a robust and efficient way to manage SmartDBEntity instances that are synchronized with the blockchain state.

The use of status tracking, UTXO management, and asynchronous processing allows for scalable and reliable operation, even in high-concurrency scenarios. The smart selection algorithm and detailed UTXO state management ensure that the system can handle multiple concurrent transactions while minimizing conflicts and maximizing throughput.

This architecture enables developers to build sophisticated decentralized applications on top of the Cardano blockchain while abstracting away much of the complexity of direct blockchain interaction. The system's ability to handle both reading and consuming UTXOs with different locking strategies provides flexibility for various transaction types while maintaining data integrity and preventing race conditions.

While the system has limitations, particularly in extreme concurrency scenarios, it represents a significant step forward in managing complex blockchain-based applications. Future improvements could focus on further optimizing UTXO management, enhancing the smart selection algorithm, and developing strategies to handle edge cases more effectively.

