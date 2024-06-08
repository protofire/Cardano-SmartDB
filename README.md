
## Table of Contents
- [Table of Contents](#table-of-contents)
- [Introduction](#introduction)
- [Features](#features)
  - [Automatic Synchronization](#automatic-synchronization)
    - [Transaction Flow](#transaction-flow)
    - [Highlights](#highlights)
- [Documentation](#documentation)
- [Installation](#installation)
- [Usage](#usage)
- [Conclusion](#conclusion)
- [Contribution](#contribution)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Introduction

The Smart DB Library is a Node.js package designed to simplify the interaction between JavaScript entities, a database, and the Cardano blockchain. It enables developers to work with entities backed by a database and synced with the blockchain, providing a transparent and seamless experience.

## Features
- **Hooks and Stores**: Provides useHooks and EasyPeasy stores to deal with wallet connection.
- **Seamless Blockchain Integration**: Simplify interactions with the Cardano blockchain using JavaScript entities.
- **Automatic Synchronization**: Automatically synchronizes the application after transactions are confirmed to reflect the latest blockchain state in the internal database. Users can also trigger synchronization manually if needed.
- **Authorization**: All API endpoints are secured with authorization logic using Next.js sessions and JWT tokens.
- **API Handling**: The library handles all API routes, reducing the complexity in the projects that use our library.
- **Example Project**: Includes a comprehensive example project in the `example` folder demonstrating the use of the library.
- **Node.js Dependency**: This is a Node.js library to add as a dependency in dApps projects.

### Automatic Synchronization

All transactions are tracked in the internal database. Transactions have a 'state' attribute. When a transaction is in the 'Submitted' state, a background job on the backend periodically checks the blockchain (using the Blockfrost API) for confirmation. Once confirmed, the job updates the transaction state to 'Confirmed' and triggers the necessary synchronization actions.

#### Transaction Flow
1. User initiates a transaction on the frontend.
2. The frontend calls a backend API, sending transaction details.
3. The backend creates a 'Pending' transaction entry in the database and returns a serialized transaction code.
4. The user signs and sends the transaction to the blockchain.
5. The transaction state in the database is updated to 'Submitted'.
6. A backend job periodically checks the blockchain for confirmation.
7. Upon confirmation, the job updates the state to 'Confirmed' and initiates synchronization.

#### Highlights
- Users do not have to wait after submitting a transaction – they can close the browser, and the backend will handle confirmation.
- The frontend periodically checks with the backend for updates on the transaction status.
- This solution is secure as long as our backend is running, and it avoids relying on third-party webhook services.
- If the backend job goes down temporarily, it can be restarted to catch up on any 'Submitted' transactions.
  
## Documentation

**Gitbook**

https://protofire-docs.gitbook.io/smartdb/

## Installation

Refer to [Installation](docs/installation.md)

## Usage

Refer to [Usage](docs/usage.md)

## Conclusion

The Smart DB library aims to bridge the gap between traditional web application development and blockchain-based data management. By abstracting complex blockchain operations into more familiar JavaScript entity interactions, it offers a developer-friendly pathway to blockchain integration. This example project is just the beginning, showcasing the potential for simplified blockchain interactions within web applications.

Remember, this is an evolving project, and future updates may introduce features enhancing the user experience and streamlining the development process.

## Contribution

Contributions to the Cardano Smart DB are welcome. Whether you're looking to fix bugs, add new features, or improve documentation, your help is appreciated.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

We express our deepest gratitude to the Cardano community for their unwavering support and valuable contributions to this project. This work is part of a funded project through Cardano Catalyst, a community-driven innovation platform. For more details on the proposal and its progress, please visit our proposal page on [IdeaScale](https://cardano.ideascale.com/c/idea/110478).
