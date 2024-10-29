# Smart DB Library: Cardano Blockchain Integration Example

## Table of Contents
- [Smart DB Library: Cardano Blockchain Integration Example](#smart-db-library-cardano-blockchain-integration-example)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Smart UTXOs and Smart Selection](#smart-utxos-and-smart-selection)
  - [Entity Types and Pages](#entity-types-and-pages)
  - [Documentation](#documentation)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Testing](#testing)
  - [Conclusion](#conclusion)
  - [Contribution](#contribution)
  - [License](#license)
  - [Acknowledgements](#acknowledgements)

## Introduction

This example demonstrates the usage of the Smart DB library, which simplifies the interaction between JavaScript entities, a database, and the Cardano blockchain. The library enables developers to work with entities backed by a database and synced with the blockchain, providing a transparent and seamless experience.

In this specific example, we showcase the creation of dummy and free entities (datums) on the Cardano blockchain and how they are saved and synced with an internal database associated with specific addresses. The project includes dynamic wallet generation, allowing users to perform transactions on the Cardano testnet.

## Features

- **Wallet Connect and Generation**: Connect with wallets using Chrome browser extensions like Eternl, Yoroi, and others. It's also possible to create wallets on-the-fly and use them in the wallet connector.
- **Seamless Blockchain Integration**: Simplify interactions with the Cardano blockchain using JavaScript entities.
- **Dynamic Synchronization**: The application's state is automatically synchronized with the blockchain, removing the need for manual syncing.
- **Smart UTXOs and Smart Selection**: Implement advanced UTXO management and selection strategies for optimized transaction handling.
- **Concurrency Testing**: Dedicated page and test suite for demonstrating and evaluating concurrent transaction capabilities.
- **User-Friendly Interface**: Demonstrates these capabilities through a Next.js application.
- **Swagger Server**: Provides a Swagger UI for testing API endpoints.
- **Comprehensive Testing**: Includes Jest tests for API endpoints and concurrency scenarios.
- **Validator Script Logic**: Example validator scripts demonstrate the implementation of custom business logic on the blockchain.
- **Automatic Entity Generation Toolkit**: Provides a toolkit to automatically generate entities and necessary files for both backend and frontend, streamlining the development process.

## Smart UTXOs and Smart Selection

The Smart DB library implements an advanced system for managing UTXOs (Unspent Transaction Outputs) called Smart UTXOs. This system, coupled with a Smart Selection algorithm, optimizes transaction handling and improves concurrent performance. Key aspects include:

- **UTXO Distinction**: The system distinguishes between reading (reference) and consuming UTXOs, allowing for more efficient resource utilization.
- **Smart Selection Algorithm**: Implements logic to choose the most appropriate UTXOs for transactions, considering factors like value, availability, and current usage.
- **Concurrency Handling**: Uses timestamps and locking mechanisms to manage UTXO access, preventing double-spending and improving throughput in high-concurrency scenarios.

## Entity Types and Pages

This example project showcases different types of entities and dedicated pages to demonstrate their functionality:

1. **Dummy Entity and Home Page**: 
   - The Dummy entity is our primary example of a SmartDB entity synced with the blockchain.
   - Located at `http://localhost:3000/`, the Home page allows users to interact with Dummy entities, demonstrating create, update, and claim (delete) operations.
   - The Dummy entity's smart contract enforces that only the creator can update or claim their entities.

2. **Free Entity and Concurrency Page**: 
   - The Free entity is designed specifically for concurrency testing. 
   - The Concurrency page at `http://localhost:3000/concurrency` sllows users to interact with Free entities. It demonstrates create, update, and delete operations, with the update operation showcasing the Smart Selection system in action.
   - Unlike the Dummy entity, the Free entity's smart contract doesn't impose special validation rules, allowing any user to interact with any Free entity UTXO.
   - The concurrency page displays a list of existing Free entities along with their four locking timestamps, providing real-time visibility into UTXO usage.

3. **Test Entity**: 
   - The Test entity is a simple, non-blockchain entity used to demonstrate basic database operations and API endpoint testing.
   - While not visible in the UI, it's crucial for showcasing how to create standard database entities within the SmartDB framework.

These different entity types and their corresponding pages provide a comprehensive view of the Smart DB library's capabilities, from blockchain integration to database management and concurrency handling.

## Documentation

For detailed documentation, please visit our [Gitbook](https://protofire-docs.gitbook.io/smartdb-example/).

## Installation

Refer to [Installation](docs/installation.md) for detailed installation instructions.

## Usage

For information on how to use this example project, including setting up entities, configuring the backend, and handling API routes, please refer to our [Usage Guide](docs/usage.md).

## Testing

This project includes three main types of tests:

1. **API Tests**: These tests cover all non-transaction API endpoints, ensuring correct responses and behavior.

2. **Concurrency Tests**: A specialized suite designed to evaluate the performance of the Smart UTXO and Smart Selection systems under various concurrent transaction scenarios.

3. **Performance Tests**: A comparative testing suite that evaluates the impact of database optimizations by comparing optimized and non-optimized entity implementations.

Each test suite provides unique insights:
- API Tests verify endpoint functionality and response accuracy
- Concurrency Tests measure Smart Selection effectiveness in high-concurrency scenarios
- Performance Tests demonstrate the impact of database optimizations including indexes, field selection, and query parameters

For more information on running tests and analyzing results, see our [Testing Guide](docs/tests.md).

## Conclusion

This example provides a foundational understanding of how the Smart DB library can be utilized to build powerful blockchain applications with ease. It showcases advanced features like Smart UTXOs and Smart Selection, demonstrating their impact on concurrent transaction handling. Feel free to explore, experiment, and build upon this example to create robust applications.

## Contribution

Contributions to the Cardano Smart DB are welcome. Whether you're looking to fix bugs, add new features, or improve documentation, your help is appreciated.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

We express our deepest gratitude to the Cardano community for their unwavering support and valuable contributions to this project. This work is part of a funded project through Cardano Catalyst, a community-driven innovation platform. For more details on the proposal and its progress, please visit our proposal page on [IdeaScale](https://cardano.ideascale.com/c/idea/110478).