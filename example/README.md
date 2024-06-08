
## Table of Contents
- [Table of Contents](#table-of-contents)
- [Introduction](#introduction)
- [Features](#features)
- [Documentation](#documentation)
- [Installation](#installation)
- [Usage](#usage)
- [Conclusion](#conclusion)
- [Contribution](#contribution)
- [License](#license)
- [Acknowledgements](#acknowledgements)
  
## Introduction

This example demonstrates the usage of the Smart DB library, which simplifies the interaction between JavaScript entities, a database, and the Cardano blockchain. The library enables developers to work with entities backed by a database and synced with the blockchain, providing a transparent and seamless experience.

In this specific example, we showcase the creation of a dummy entity (datum) on the Cardano blockchain and how it is saved and synced with an internal database associated with a specific address. The project includes dynamic wallet generation, allowing users to perform transactions on the Cardano testnet. The example validator script enforces custom logic where only the datum creator can update or claim it.

With the new library version, synchronization is handled dynamically. The manual "Sync" button is still present but no longer necessary for reflecting the latest state in the application's database.

## Features

- **Wallet Connect and Generation**: You can connect with wallets using the Chrome browser extensions like Eternl, Yoroi, and others. It’s also possible to create wallets on-the-fly and use them in the wallet connector.
- **Seamless Blockchain Integration**: Simplify interactions with the Cardano blockchain using JavaScript entities.
- **Dynamic Synchronization**: The application's state is automatically synchronized with the blockchain, removing the need for manual syncing.
- **Exclusive Update/Claim Logic**: Only the creator of the datum can update or claim, ensuring creator exclusivity.
- **User-Friendly Interface**: Demonstrates these capabilities through a Next.js application.
- **Swagger Server**: Provides a Swagger UI for testing API endpoints.
- **Test API**: The project includes Jest tests for the API.
- **Validator Script Logic**: The example validator script only permits the creator of the datum to consume it for updates or claims, demonstrating the implementation of custom business logic on the blockchain.

## Documentation

**Gitbook**

https://protofire-docs.gitbook.io/smartdb-example/

## Installation

Refer to [Installation](docs/installation.md)

## Usage

Refer to [Usage](docs/usage.md)

## Conclusion

This example provides a foundational understanding of how the Smart DB library can be utilized to build powerful blockchain applications with ease. Feel free to explore, experiment, and build upon this example to create robust applications.

The Smart DB library aims to bridge the gap between traditional web application development and blockchain-based data management. By abstracting complex blockchain operations into more familiar JavaScript entity interactions, it offers a developer-friendly pathway to blockchain integration. This example project is just the beginning, showcasing the potential for simplified blockchain interactions within web applications.

Remember, this is an evolving project, and future updates may introduce features like automatic synchronization after transactions are confirmed, enhancing the user experience and streamlining the development process.

## Contribution

Contributions to the Cardano Smart DB are welcome. Whether you're looking to fix bugs, add new features, or improve documentation, your help is appreciated.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

We express our deepest gratitude to the Cardano community for their unwavering support and valuable contributions to this project. This work is part of a funded project through Cardano Catalyst, a community-driven innovation platform. For more details on the proposal and its progress, please visit our proposal page on [IdeaScale](https://cardano.ideascale.com/c/idea/110478).
