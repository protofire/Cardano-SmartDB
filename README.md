# Smart DB Library

## Table of Contents
- [Smart DB Library](#smart-db-library)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Conclusion](#conclusion)
  - [Contribution](#contribution)
  - [License](#license)
  - [Acknowledgements](#acknowledgements)
  
## Introduction
The Smart DB Library is a Node.js package designed to simplify the interaction between JavaScript entities, a database, and the Cardano blockchain. It enables developers to work with entities backed by a database and synced with the blockchain, providing a transparent and seamless experience.

## Features
- **Hooks and Stores**: Provides useHooks and EasyPeasy stores to deal with wallet connection.
- **Seamless Blockchain Integration**: Simplify interactions with the Cardano blockchain using JavaScript entities.
- **Manual Synchronization**: Users must manually synchronize the application after transactions are confirmed to reflect the latest blockchain state in the internal database.
- **Authorization**: All API endpoints are secured with authorization logic using Next.js sessions and JWT tokens.
- **API Handling**: The library handles all API routes, reducing the complexity in the projects that use our library.
- **Example Project**: Includes a comprehensive example project in the `example` folder demonstrating the use of the library.
- **Node.js Dependency**: This is a Node.js library to add as a dependency in dApps projects.

## Conclusion

The Smart DB library aims to bridge the gap between traditional web application development and blockchain-based data management. By abstracting complex blockchain operations into more familiar JavaScript entity interactions, it offers a developer-friendly pathway to blockchain integration. This example project is just the beginning, showcasing the potential for simplified blockchain interactions within web applications.

Remember, this is an evolving project, and future updates may introduce features like automatic synchronization after transactions are confirmed, enhancing the user experience and streamlining the development process.

## Contribution

Contributions to the Cardano Smart DB are welcome. Whether you're looking to fix bugs, add new features, or improve documentation, your help is appreciated.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

We express our deepest gratitude to the Cardano community for their unwavering support and valuable contributions to this project. This work is part of a funded project through Cardano Catalyst, a community-driven innovation platform. For more details on the proposal and its progress, please visit our proposal page on [IdeaScale](https://cardano.ideascale.com/c/idea/110478).
