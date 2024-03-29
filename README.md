# Smart DB Library: Cardano Blockchain Integration Example

## Introduction

This example demonstrates the usage of the Smart DB library, which simplifies the interaction between JavaScript entities, a database, and the Cardano blockchain. The library enables developers to work with entities backed by a database and synced with the blockchain, providing a transparent and seamless experience.

In this specific example, we showcase the creation of a dummy entity (datum) on the Cardano blockchain and how it is saved and synced with an internal database associated with a specific address. The project includes dynamic wallet generation, allowing users to perform transactions on the Cardano testnet. The example validator script enforces custom logic where only the datum creator can update or claim it.

Please note that in this stage, after a transaction is confirmed, the user needs to manually trigger the synchronization process by clicking the "Sync" button to reflect the latest state in the application's database.

## Features

- **Wallet Generation**: Create wallets on-the-fly and manage the private key.
- **Seamless Blockchain Integration**: Simplify interactions with the Cardano blockchain using JavaScript entities.
- **Manual Synchronization**: Users must manually synchronize the application after transactions are confirmed to reflect the latest blockchain state in the internal database.
- **Exclusive Update/Claim Logic**: Only the creator of the datum can update or claim, ensuring creator exclusivity.
- **User-Friendly Interface**: Demonstrates these capabilities through a Next.js application.

## Getting Started

### Prerequisites

Before you begin, ensure you have:
- Node.js (version 14.0.0 or later)
- npm (version 6.0.0 or later) or Yarn
- Basic knowledge of React and Next.js

### Installation

1. **Clone the Repository**

   ```
   git clone [https://github.com/protofire/Cardano-SmartDB.git](https://github.com/protofire/Cardano-SmartDB)
   cd Cardano-SmartDB
   ```

2. **Install Dependencies**

   ```
   npm install
   # Or if you use Yarn
   yarn
   ```

3. **Run the Application**

   ```
   npm run dev
   # Or for Yarn users
   yarn dev
   ```

   Visit `http://localhost:3000` in your browser to view the application.

## Familiarize Yourself

Open the `Home.tsx` component file in your preferred code editor and review the code structure and functions provided.

## Usage

### Wallet Creation

Upon launching the example, a new wallet is generated on the fly by creating a random private key. You can save this private key for future use to retain the same ADA and tokens associated with the wallet.

### Faucet

Click the "Faucet" button to obtain testnet ADA for transaction fees.

### Check Balance

Click the "Refresh Balance" button to check the wallet's balance.

### Create Dummy Datum Transaction

1. Enter a dummy value in the input field provided.
2. Click "Create" to initiate a new dummy datum transaction.
3. A modal will display the transaction status and details.

### Sync Database

After a transaction is confirmed, users must manually initiate synchronization to update the application's internal database with the blockchain's state. This ensures that the data displayed reflects the latest changes made on the blockchain.

To sync the latest blockchain state with the internal database after transactions, users need to click the "Sync" button within the application. This action fetches the current state of the blockchain and updates the local database accordingly.

### Update Datum Value

1. Click "Update" next to the datum you want to modify.
2. Enter a new value and click "Save".
3. A modal will show the transaction status.
   
- This action is restricted to the datum's creator per the validator script's logic.

### Claim Funds

1. Click "Claim" to transfer the funds associated with a dummy entity to your wallet.
2. A modal will show the transaction status.
   
- This action is restricted to the datum's creator per the validator script's logic.

### Transaction Modal

This modal appears during any transaction process to display status and details.

## Validator Script Logic

The example validator script only permits the creator of the datum to consume it for updates or claims, demonstrating the implementation of custom business logic on the blockchain.

## Code Structure

The `Home` component is the main entry point, managing state and user interactions. It includes functions for generating scripts, managing transactions, and syncing with the blockchain.

- generateScripts: Generates the necessary scripts (minting policy and validator) for the dummy smart contract.
- getBalance: Retrieves the balance of the connected wallet.
- handleBtnCreateTx: Creates a new dummy datum transaction and saves the entity in the internal database.
- handleBtnUpdateTx: Updates the value of a dummy datum and syncs the changes with the internal database.
- handleBtnClaimTx: Claims the funds associated with a dummy datum.
- handleBtnSync: Synchronizes the local database with the blockchain state, ensuring data consistency.

The component leverages various helper functions and libraries from the Smart DB library to interact with the Cardano blockchain, manage the smart contract state, and perform database synchronization.

## Conclusion

This example provides a foundational understanding of how the Smart DB library can be utilized to build powerful blockchain applications with ease. Feel free to explore, experiment, and build upon this example to create robust applications.

The Smart DB library aims to bridge the gap between traditional web application development and blockchain-based data management. By abstracting complex blockchain operations into more familiar JavaScript entity interactions, it offers a developer-friendly pathway to blockchain integration. This example project is just the beginning, showcasing the potential for simplified blockchain interactions within web applications.

Remember, this is an evolving project, and future updates may introduce features like automatic synchronization after transactions are confirmed, enhancing the user experience and streamlining the development process.

## Contribution

Contributions to the Cardano Smart DB are welcome. Whether you're looking to fix bugs, add new features, or improve documentation, your help is appreciated. Please see our contribution guidelines for more information.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.


## Acknowledgements

We express our deepest gratitude to the Cardano community for their unwavering support and valuable contributions to this project. This work is part of a funded project through Cardano Catalyst, a community-driven innovation platform. For more details on the proposal and its progress, please visit our proposal page on [IdeaScale](https://cardano.ideascale.com/c/idea/110478).