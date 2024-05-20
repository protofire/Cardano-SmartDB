# Smart DB Library: Cardano Blockchain Integration Example

## Table of Contents
- [Smart DB Library: Cardano Blockchain Integration Example](#smart-db-library-cardano-blockchain-integration-example)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installing Node.js and npm](#installing-nodejs-and-npm)
      - [Windows](#windows)
      - [macOS](#macos)
      - [Ubuntu](#ubuntu)
      - [Optional: Install Yarn](#optional-install-yarn)
    - [Node Version Management with nvm](#node-version-management-with-nvm)
      - [Benefits of Using nvm](#benefits-of-using-nvm)
      - [Installing nvm](#installing-nvm)
        - [Windows](#windows-1)
        - [macOS and Ubuntu](#macos-and-ubuntu)
    - [Using nvm to Install Node.js](#using-nvm-to-install-nodejs)
    - [Obtaining Blockfrost API Keys](#obtaining-blockfrost-api-keys)
    - [Installation of the example Project](#installation-of-the-example-project)
  - [Familiarize Yourself](#familiarize-yourself)
  - [Usage](#usage)
    - [Wallet Connection](#wallet-connection)
      - [Wallet Creation](#wallet-creation)
    - [Faucet](#faucet)
    - [Check Balance](#check-balance)
    - [Create Dummy Datum Transaction](#create-dummy-datum-transaction)
    - [Sync Database](#sync-database)
    - [Update Datum Value](#update-datum-value)
    - [Claim Funds](#claim-funds)
    - [Transaction Modal](#transaction-modal)
  - [Validator Script Logic](#validator-script-logic)
  - [Project Code Structure](#project-code-structure)
    - [Configuration and Contracts](#configuration-and-contracts)
    - [Components and Pages](#components-and-pages)
    - [Library Implementation and Entities files](#library-implementation-and-entities-files)
    - [API and Backend](#api-and-backend)
  - [Example Code Structure](#example-code-structure)
    - [Directories](#directories)
  - [Swagger Server and UI](#swagger-server-and-ui)
    - [Run Swagger Server](#run-swagger-server)
    - [Access Swagger UI](#access-swagger-ui)
    - [Use Health Endpoint](#use-health-endpoint)
    - [Download Swagger JSON](#download-swagger-json)
  - [Importing into Postman](#importing-into-postman)
    - [Import JSON](#import-json)
    - [Test API in Postman: Health Endpoint](#test-api-in-postman-health-endpoint)
    - [Set Bearer Token in Postman](#set-bearer-token-in-postman)
  - [Jest Tests for API](#jest-tests-for-api)
    - [Run Jest Tests](#run-jest-tests)
    - [Test Results](#test-results)
  - [Setting Up New Projects with Custom Entities](#setting-up-new-projects-with-custom-entities)
    - [Entities](#entities)
      - [Normal Entities](#normal-entities)
        - [Test Entity Files](#test-entity-files)
      - [Smart DB Entities](#smart-db-entities)
        - [Dummy Entity Files](#dummy-entity-files)
  - [Root Backend File](#root-backend-file)
    - [Root Backend File Example](#root-backend-file-example)
      - [Endpoints Configuration](#endpoints-configuration)
    - [NextJs Api Handler Files](#nextjs-api-handler-files)
  - [Conclusion](#conclusion)
  - [Contribution](#contribution)
  - [License](#license)
  - [Acknowledgements](#acknowledgements)
  
## Introduction

This example demonstrates the usage of the Smart DB library, which simplifies the interaction between JavaScript entities, a database, and the Cardano blockchain. The library enables developers to work with entities backed by a database and synced with the blockchain, providing a transparent and seamless experience.

In this specific example, we showcase the creation of a dummy entity (datum) on the Cardano blockchain and how it is saved and synced with an internal database associated with a specific address. The project includes dynamic wallet generation, allowing users to perform transactions on the Cardano testnet. The example validator script enforces custom logic where only the datum creator can update or claim it.

Please note that in this stage, after a transaction is confirmed, the user needs to manually trigger the synchronization process by clicking the "Sync" button to reflect the latest state in the application's database.

## Features

- **Wallet Connect and Generation**: You can connect with wallets using the Chrome browser extensions like Eternl, Yoroi, and others. It’s also possible to create wallets on-the-fly and use them in the wallet connector.
- **Seamless Blockchain Integration**: Simplify interactions with the Cardano blockchain using JavaScript entities.
- **Manual Synchronization**: Users must manually synchronize the application after transactions are confirmed to reflect the latest blockchain state in the internal database.
- **Exclusive Update/Claim Logic**: Only the creator of the datum can update or claim, ensuring creator exclusivity.
- **User-Friendly Interface**: Demonstrates these capabilities through a Next.js application.
- **Swagger Server**: Provides a Swagger UI for testing API endpoints.
- **Test API**: The project includes Jest tests for the API.

## Getting Started

### Prerequisites

Before you begin, ensure you have:
- Node.js (version 18.0.0 or later)
- npm (version 10.1.0 or later) or Yarn
- Basic knowledge of React and Next.js
- Blockfrost API Keys
  
### Installing Node.js and npm

Node.js is a runtime required to execute JavaScript on the server, and npm is the package manager for JavaScript. 

You can install Node.js and npm directly from the Node.js official website, or if you prefer a version management system, you can refer to the section on installing Node.js using nvm. Using nvm provides the flexibility to switch between different Node.js versions and is especially useful if you work with multiple JavaScript projects requiring different Node.js versions.

To continue with a direct installation, follow the provided instructions.

For managing multiple versions and a more flexible development environment, see the section "Node Version Management with nvm" for detailed instructions.

#### Windows

1. Download the Node.js installer from the [official Node.js website](https://nodejs.org/).
2. Run the installer, which includes npm, and follow the prompts.

Check the installation:

```
node -v
npm -v
```

#### macOS

1. If Homebrew is not installed, install it first from [Homebrew's website](https://brew.sh/).
2. Install Node.js (npm will be included) using Homebrew:

```
brew update
brew install node
```

Check the installation:

```
node -v
npm -v
```

#### Ubuntu

1. Update your local package index:

```
sudo apt update
```

2. Install Node.js and npm:

```
sudo apt install nodejs npm
```

Check the installation:

```
node -v
npm -v
```

#### Optional: Install Yarn

Yarn is an alternative package manager to npm. To install Yarn using npm, run:

```
npm install --global yarn
```

Verify the installation of Yarn:

```
yarn --version
```

### Node Version Management with nvm

When working with Node.js, you may encounter scenarios where different projects require different Node.js versions. This is where Node Version Manager (`nvm`) becomes essential. `nvm` allows you to install multiple versions of Node.js and switch between them as needed. It's particularly useful for testing applications across various Node.js versions, ensuring compatibility, and managing global Node.js packages specific to each version.

#### Benefits of Using nvm

- **Versatility**: Install and switch between any versions of Node.js effortlessly.
- **No Sudo Required**: Install Node.js versions without administrator privileges.
- **Convenient for Multiple Projects**: Each project can utilize its own Node.js version without affecting other projects.

#### Installing nvm

Below are instructions for installing `nvm` on Windows, macOS, and Ubuntu:

##### Windows

Windows users can utilize `nvm-windows`, which is an alternative to `nvm` designed specifically for Windows:

1. Download the latest installer from the [nvm-windows releases page](https://github.com/coreybutler/nvm-windows/releases).
2. Execute the installer and follow the prompts to complete the installation.

##### macOS and Ubuntu

The installation process for macOS and Ubuntu is similar:

1. Open the terminal.
2. Install `nvm` by running the install script:

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

or with `wget`:

```
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

3. Add `nvm` to the shell by sourcing it from your profile script:

```
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -

s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

### Using nvm to Install Node.js

Once `nvm` is installed, you can install a specific version of Node.js:

```
nvm install 18
nvm use 18
```

Set the default Node.js version for any new shell:

```
nvm alias default 18
```

Check the current version in use:

```
nvm current
```

List installed Node.js versions:

```
nvm ls
```

Switch between installed versions with:

```
nvm use <version_number>
```

Replace `<version_number>` with the actual version of Node.js you want to switch to.

By following these steps, you will have `nvm` set up on your system, allowing for flexible Node.js version management tailored to your development needs.

### Obtaining Blockfrost API Keys

To interact with the Cardano blockchain through our project, you will need to obtain API keys from Blockfrost, a service that provides access to the Cardano blockchain data. You'll require separate keys for each network you intend to work with: Mainnet, Preview testnet, and Preprod testnet.

Follow the steps below to get your API keys from Blockfrost:

1. Create a Blockfrost Account:

Navigate to the [Blockfrost website](https://blockfrost.io/).
Sign up for an account by clicking the "Sign Up" button and following the registration process.

2. Create a New Project:

Once logged in, go to the dashboard and create a new project.
Provide a name for your project and select the network for which you want the API key.
You will need to create three separate projects if you want keys for all three networks: Mainnet, Preview testnet, and Preprod testnet.

3. Retrieve Your API Keys:

After creating a project, you will be directed to the project overview page.
Here, you can find the API key under the 'Project keys' section.
Copy the PROJECT_ID which is your API key for the respective network.

4. Set Up Environment Variables:

In your local development environment, set the API keys as environment variables in `.env.local` file:

```
BLOCKFROST_KEY_MAINNET=your_mainnet_project_key_here
BLOCKFROST_KEY_PREVIEW=your_preview_testnet_project_key_here
BLOCKFROST_KEY_PREPROD=your_preprod_testnet_project_key_here
```

Replace your_mainnet_project_key_here, your_preview_testnet_project_key_here, and your_preprod_testnet_project_key_here with the actual keys you obtained from Blockfrost.

The configuration for the `.env.local` file is explained in detail in the following section of this README.

### Installation of the example Project

1. **Clone the Repository**

```
git clone git@github.com:protofire/Cardano-SmartDB.git
cd Cardano-SmartDB
```

2. **Navigate to example folder**

```
cd example
```

3. **Install Dependencies**

```
npm install
# Or if you use Yarn
yarn
```

4. **Environment Setup**

Create a `.env.local` file at the root of your project by copying the contents from the `.env` template file. Adjust the environment variables according to your project's needs:

- `REACT_EDITOR`: Specifies the IDE to open files from within the application.
- `NEXT_PUBLIC_CARDANO_NET`: Sets the Cardano network environment. Valid options include 'Mainnet', 'Preview' or 'Preprod'.
- `NEXT_PUBLIC_BLOCKFROST_URL_MAINNET`: Blockfrost API URL for the Cardano Mainnet.
- `NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_MAINNET`: URL for the Cardano Mainnet blockchain explorer.
- `NEXT_PUBLIC_BLOCKFROST_URL_PREVIEW`: Blockfrost API URL for the Cardano Preview testnet.
- `NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_PREVIEW`: URL for the Cardano Preview testnet blockchain explorer.
- `NEXT_PUBLIC_BLOCKFROST_URL_PREPROD`: Blockfrost API URL for the Cardano Preprod testnet.
- `NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL_PREPROD`: URL for the Cardano Preprod testnet blockchain explorer.
- `BLOCKFROST_KEY_MAINNET`: Your Blockfrost project key for the Mainnet.
- `BLOCKFROST_KEY_PREVIEW`: Your Blockfrost project key for the Preview testnet.
- `BLOCKFROST_KEY_PREPROD`: Your Blockfrost project key for the Preprod testnet.
- `NEXT_PUBLIC_REACT_SERVER_BASEURL`: Base URL for the React server.
- `NEXT_PUBLIC_REACT_SERVER_URL`: Full URL for the React server, including the port.
- `NEXT_PUBLIC_REACT_SERVER_API_URL`: Full URL for the React server's API endpoint.
- `NEXTAUTH_URL`: Base URL for NextAuth to use for redirects and callback URLs.
- `NEXTAUTH_SECRET`: A secret used by NextAuth for session tokens; changing it invalidates all active sessions.
- `LOGIN_JWT_SECRET_KEY`: A secret used to create challenge tokens and our session tokens; changing it invalidates these tokens and associated sessions.
- `NEXT_PUBLIC_USE_BLOCKCHAIN_TIME`: Boolean flag to decide if blockchain time should be used.
- `USE_DATABASE`: Type of database used, such as 'mongo' for MongoDB.
- `MONGO_URLDB`: MongoDB connection string.

After setting these variables, your application will be configured to communicate with the specified Cardano network and utilize the necessary services and databases.

5. **Run the Application in developer mode**

```
npm run dev
# Or for Yarn users
yarn dev
```

Visit `http://localhost:3000` in your browser to view the application in developer mode.

6. **Build and Run Application**

First, compile your application into static assets for production by running the build command. This process bundles your React application and optimizes it for the best performance. The build is minified, and filenames include the hashes for browser caching efficiency.

```
npm run build
# Or if you use Yarn
yarn build
```

**Run the Built Application**

Once the build is complete, you can start the application in production mode. The start script will initiate the server to serve your built static files. In production mode, you'll see the performance benefits of the optimization steps taken during the build.

```
npm run start
# Or for Yarn users
yarn start
```

Visit `http://localhost:3000` in your browser to interact with the application in production mode.

**Additional Notes:**

It's important to ensure that all environment variables set in your `.env.local` file are compatible with your production environment. Any sensitive keys should not be hard-coded and must be securely managed.

The npm run build or yarn build command should be run in your production environment or as part of a CI/CD pipeline to ensure that the build assets are suitable for the production servers they will run on.

When running in production, monitoring and logging tools should be implemented to keep track of the application's health and performance.

By following these steps, your application will be built and run in a production environment, providing users with a faster and more secure experience.

## Familiarize Yourself

Open The `Home` component, located in `src/components/public/Home/Home.tsx`, in your preferred code editor and review the code structure and functions provided.

The `Home` component is the main entry point, managing state and user interactions. It includes functions for generating scripts, managing transactions, and syncing with the blockchain.

- generateScripts: Generates the necessary scripts (minting policy and validator) for the dummy smart contract.
- getBalance: Retrieves the balance of the connected wallet.
- handleBtnCreateTx: Creates a new dummy datum transaction and saves the entity in the internal database.
- handleBtnUpdateTx: Updates the value of a dummy datum and syncs the changes with the internal database.
- handleBtnClaimTx: Claims the funds associated with a dummy datum.
- handleBtnSync: Synchronizes the local database with the blockchain state, ensuring data consistency.

The component leverages various helper functions and libraries from the Smart DB library to interact with the Cardano blockchain, manage the smart contract state, and perform database synchronization.

## Usage

### Wallet Connection 

A new wallet connector button and modal allow users to connect with browser extension wallets (like Eternl, Yoroi) or by using a private key. After connecting, there is a button to get an API key in the wallet connected modal.

#### Wallet Creation

A new wallet is generated on the fly by creating a random private key. You can save this private key for future use to retain the same ADA and tokens associated with the wallet.

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

## Project Code Structure

The project's architecture is designed for applications interacting with the Cardano blockchain. It comprises essential directories and files, each serving a distinct role:

### Configuration and Contracts
- `_config`: Contains configuration files for various tools within the project.
- `_smart-contracts`: Stores the Plutus files with the cbor hex code of the scripts used in the Dummy Test Example. While the code is hardcoded in the Home component, it's maintained here for reference.

### Components and Pages
- `src/components`: React components used throughout the application reside here.
- `src/pages`: New pages can be added within this directory. Essential files like `_app.tsx`, `_document.tsx`, and `index.tsx` are set up to load the `Home` component by default.

### Library Implementation and Entities files
- `src/lib/DummyExample`: Sample implementation directory for creating entities that are synced with the blockchain. This directory should contain all entity models required by a project, whether they are synced with the blockchain (like the Dummy Entity) or simply database-backed entities with full API support for the frontend and backend.

Read this section for further clarifications:
[Setting Up New Projects with Custom Entities](#setting-up-new-projects-with-custom-entities)

### API and Backend
- `src/pages/api`: Defines the API routes and backend logic for server-side operations.

## Example Code Structure

The example code is organized to showcase the usage of the Smart DB library, providing a clear structure for ease of understanding and modification.

### Directories

```
├── __tests__
│   ├── api.ts
│   ├── baseTestCases.js
│   ├── csvReporter.js
│   ├── testCases-DELETE-Entity-ById.js
│   ├── testCases-GET-Entity-All.js
│   ├── testCases-GET-Entity-Exists-Id.js
│   ├── testCases-GET-Entity-Id.js
│   ├── testCases-Others.js
│   ├── testCases-POST-Create-Entity.js
│   ├── testCases-POST-Entity-ByParams.js
│   ├── testCases-POST-Entity-Count.js
│   ├── testCases-POST-Entity-Exists.js
│   ├── testCases-POST-Update-Entity.js
│   └── testResults.csv
├── _config
│   └── protocol-parameters.json
├── _smart-contracts
│   ├── policyID.plutus
│   └── validator.plutus
├── _swagger
│   ├── server.ts
│   └── swagger.ts
├── jest.config.js
├── next-env.d.ts
├── next.config.js
├── package-lock.json
├── package.json
├── pages-manifest.json
├── prettier.config.js
├── public
│   └── swagger.json
├── src
│   ├── components
│   │   ├── Commons
│   │   │   ├── LoaderButton
│   │   │   │   ├── LoaderButton.module.scss
│   │   │   │   └── LoaderButton.tsx
│   │   │   └── WalletConnector
│   │   │       ├── WalletConnector.module.scss
│   │   │       ├── WalletConnector.tsx
│   │   │       └── WalletInfo
│   │   │           ├── WalletApiKey
│   │   │           │   ├── WalletApiKey.module.scss
│   │   │           │   ├── WalletApiKey.tsx
│   │   │           │   └── useWalletApiKey.tsx
│   │   │           ├── WalletInfo.module.scss
│   │   │           ├── WalletInfo.tsx
│   │   │           └── WalletList
│   │   │               ├── WalletList.module.scss
│   │   │               ├── WalletList.tsx
│   │   ├── UI
│   │   │   └── Layout
│   │   │       ├── Layout.module.scss
│   │   │       └── Layout.tsx
│   │   └── public
│   │       └── Home
│   │           ├── Home.module.scss
│   │           └── Home.tsx
│   └── lib
│       └── DummyExample
│           ├── BackEnd
│           │   ├── Dummy.BackEnd.Api.Handlers.Tx.ts
│           │   ├── Test.BackEnd.Api.Handlers.ts
│           │   └── index.ts
│           ├── Entities
│           │   ├── Dummy.Entity.Mongo.ts
│           │   ├── Dummy.Entity.ts
│           │   ├── Redeemers
│           │   │   └── Dummy.Redeemer.ts
│           │   ├── Test.Entity.Mongo.ts
│           │   ├── Test.Entity.ts
│           │   ├── index.BackEnd.ts
│           │   └── index.ts
│           └── FrontEnd
│               ├── Dummy.FrontEnd.Api.Calls.ts
│               ├── Test.FrontEnd.Api.Calls.ts
│               └── backEnd.ts
├── pages
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── api
│   │   ├── [[...query]].ts
│   │   └── auth
│   │       └── [...nextauth].ts
│   ├── global.scss
│   ├── index.module.scss
│   └── index.tsx
├── styles
│   └── shared.module.scss
├── tsconfig.json
└── tsconfig.server.json
```

## Swagger Server and UI

The example project includes a Swagger server to provide a user-friendly interface for testing API endpoints.

### Run Swagger Server

```
npm run swagger-start
```

### Access Swagger UI

Visit `http://localhost:3001/docs/` in your browser to access the Swagger UI.

### Use Health Endpoint

- To test the health endpoint, click on the `/health` endpoint in the Swagger UI.
- Click the "Try it out" button, then click "Execute" to see the response.

### Download Swagger JSON

To download the Swagger JSON file:

- Visit `http://localhost:3000/swagger.json`.
- Save the JSON file to your local machine.

## Importing into Postman

You can import the Swagger JSON into Postman to test the API endpoints.

### Import JSON

1. Open Postman and click "Import".
2. Select the "Link" tab.
3. Enter the URL to your saved Swagger JSON file or upload the file directly.
4. Click "Import".

### Test API in Postman: Health Endpoint

1. In Postman, find the imported collection and select the `/health` endpoint.
2. Click "Send" to test the endpoint.

### Set Bearer Token in Postman

To use the API key generated in the wallet connected modal:

1. In Postman, go to the "Authorization" tab for the endpoint you want to test.
2. Select "Bearer Token" from the "Type" dropdown.
3. Enter the API key in the "Token" field.
4. Click "Send" to test the endpoint with the Bearer Token.

## Jest Tests for API

The project includes Jest tests for the API.

### Run Jest Tests

```
npm run test-api
```

### Test Results

The test results will be generated in a CSV file located at:

```
__tests__/testResults.csv
```

## Setting Up New Projects with Custom Entities

### Entities

Entities in Smart DB Library can be classified into two types: normal entities and Smart DB entities.

#### Normal Entities

Normal entities are standard database entities with frontend API calls and backend code, and they have a presence in the database.

The example includes a new normal entity called "Test Entity". This is a simple entity with a database backend, not linked to blockchain datums, making it easy to test all API endpoints. To create a normal entity, follow the example below:

##### Test Entity Files

- **Entity Definition**: Located at `exame/src/lib/DummyExample/Entities/Test.Entity.ts`
- **MongoDB Model**: Located at `src/lib/DummyExample/Entities/Test.Entity.Mongo.ts`
- **Backend Handlers**: Located at `src/lib/DummyExample/BackEnd/Test.BackEnd.Api.Handlers.ts`
- **Frontend API Calls**: Located at `src/lib/DummyExample/FrontEnd/Test.FrontEnd.Api.Calls.ts`

**Test.Entity.ts**

Entities must extend `BaseEntity` and use the `@asEntity` decorator.

```
import 'reflect-metadata';
import { BaseEntity, Convertible, asEntity } from 'smart-db';

@asEntity()
export class TestEntity extends BaseEntity {
    protected static _apiRoute: string = 'test';
    protected static _className: string = 'Test';

    @Convertible()
    name!: string;

    @Convertible()
    description!: string;

    public static defaultFieldsWhenUndefined: Record<string, boolean> = {};

    public static alwaysFieldsForSelect: Record<string, boolean> = {
        ...super.alwaysFieldsForSelect,
        name: true,
        description: true,
    };
}
```

**Test.Entity.Mongo.ts**

Classes for Mongo Schemma should extend `BaseEntityMongo` and use the `@MongoAppliedFor` decorator.

```
import { type PaymentKeyHash } from 'lucid-cardano';
import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { Maybe, MongoAppliedFor } from 'smart-db';
import { BaseEntityMongo } from 'smart-db/backEnd';
import { TestEntity } from './Test.Entity';

@MongoAppliedFor([TestEntity])
export class TestEntityMongo extends BaseEntityMongo {
    protected static Entity = TestEntity;
    protected static _mongoTableName: string = TestEntity.className();

    public getMongoStatic(): typeof TestEntityMongo {
        return this.constructor as typeof TestEntityMongo;
    }

    public static getMongoStatic(): typeof TestEntityMongo {
        return this as typeof TestEntityMongo;
    }

    public getStatic(): typeof TestEntity {
        return this.getMongoStatic().getStatic() as typeof TestEntity;
    }

    public static getStatic(): typeof TestEntity {
        return this.Entity as typeof TestEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }

    public static MongoModel() {
        interface Interface {
            name: PaymentKeyHash;
            description: Maybe<PaymentKeyHash>;
        }

        const schema = new Schema<Interface>({
            name: { type: String, required: true },
            description: { type: String, required: true },
        });

        const ModelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return ModelDB;
    }
}
```

**Test.BackEnd.Api.Handlers.ts**

The backend for new entities must extend both `BaseBackEndApplied` and `BaseBackEndApiHandlers` and use the `@BackEndAppliedFor` and `@BackEndApiHandlersFor` decorators.

```
import {
    BackEndApiHandlersFor,
    BackEndAppliedFor,
    BaseBackEndApiHandlers,
    BaseBackEndApplied,
    BaseBackEndMethods
} from 'smart-db/backEnd';
import { TestEntity } from '../Entities';

@BackEndAppliedFor(TestEntity)
export class TestBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = TestEntity;
    protected static _BackEndMethods = BaseBackEndMethods;
}

@BackEndApiHandlersFor(TestEntity)
export class TestApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = TestEntity;
    protected static _BackEndApplied = TestBackEndApplied;
}
```

**Test.FrontEnd.Api.Calls.ts**

Classes for frontend API calls should extend `BaseFrontEndApiCalls`.

```
import { BaseFrontEndApiCalls } from 'smart-db';
import { TestEntity } from '../Entities';

export class TestApi extends BaseFrontEndApiCalls {
    protected static _Entity = TestEntity;
}
```

#### Smart DB Entities

Smart DB entities include all the features of normal entities but also have methods to synchronize them with blockchain datums.

The example includes a smartDb entity called "Dummy Entity".

##### Dummy Entity Files

- **Entity Definition**: Located at `src/lib/DummyExample/Entities/Dummy.Entity.ts`
- **MongoDB Model**: Located at `src/lib/DummyExample/Entities/Dummy.Entity.Mongo.ts`
- **Backend Handlers**: Located at `src/lib/DummyExample/BackEnd/Dummy.BackEnd.Api.Handlers.Tx.ts`
- **Frontend API Calls**: Located at `src/lib/DummyExample/FrontEnd/Dummy.FrontEnd.Api.Calls.ts`

**Dummy.Entity.ts**

Entities must extend `BaseSmartDBEntity` and use the `@asSmartDBEntity` decorator. Fields synchronized with the database should utilize the `@Convertible({ isForDatum: true })` decorator.

```
import { type PaymentKeyHash } from 'lucid-cardano';
import 'reflect-metadata';
import { BaseSmartDBEntity, Convertible, Maybe, StakeCredentialPubKeyHash, asSmartDBEntity } from 'smart-db';

@asSmartDBEntity()
export class DummyEntity extends BaseSmartDBEntity {
    protected static _apiRoute: string = 'dummy';
    protected static _className: string = 'Dummy';

    protected static _plutusDataIndex = 0;
    protected static _is_NET_id_Unique = false;

    // #region fields

    _NET_id_TN: string = 'DummyID';

    // #endregion fields

    // #region datum

    @Convertible({ isForDatum: true })
    ddPaymentPKH!: PaymentKeyHash;

    @Convertible({ isForDatum: true, type: Maybe<StakeCredentialPubKeyHash> })
    ddStakePKH!: Maybe<StakeCredentialPubKeyHash>;

    @Convertible({ isForDatum: true })
    ddValue!: BigInt;

    // #endregion datum

    // #region  db

    public static defaultFieldsWhenUndefined: Record<string, boolean> = {};

    public static alwaysFieldsForSelect: Record<string, boolean> = {
        ...super.alwaysFieldsForSelect,
        ddPaymentPKH: true,
        ddStakePKH: true,
        ddValue: true,
    };

    // #endregion  db
}
```

**Dummy.Entity.Mongo.ts**

Classes for Mongo Schemma should extend `BaseSmartDBEntityMongo` and use the `@MongoAppliedFor` decorator.

```
import { type PaymentKeyHash } from 'lucid-cardano';
import { Schema, model, models } from 'mongoose';
import 'reflect-metadata';
import { Maybe, MongoAppliedFor } from 'smart-db';
import { BaseSmartDBEntityMongo, IBaseSmartDBEntity } from 'smart-db/backEnd';
import { DummyEntity } from './Dummy.Entity';

@MongoAppliedFor([DummyEntity])
export class DummyEntityMongo extends BaseSmartDBEntityMongo {
    protected static Entity = DummyEntity;
    protected static _mongoTableName: string = DummyEntity.className();

    // #region fields

    // #endregion fields

    // #region internal class methods

    public getMongoStatic(): typeof DummyEntityMongo {
        return this.constructor as typeof DummyEntityMongo;
    }

    public static getMongoStatic(): typeof DummyEntityMongo {
        return this as typeof DummyEntityMongo;
    }

    public getStatic(): typeof DummyEntity {
        return this.getMongoStatic().getStatic() as typeof DummyEntity;
    }

    public static getStatic(): typeof DummyEntity {
        return this.Entity as typeof DummyEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }

    // #endregion internal class methods

    // #region mongo db

    public static MongoModel() {
        interface InterfaceDB extends IBaseSmartDBEntity {}
        interface InterfaceDatum {
            ddPaymentPKH: PaymentKeyHash;
            ddStakePKH: Maybe<PaymentKeyHash>;
            ddValue: string;
        }

        interface Interface extends InterfaceDB, InterfaceDatum {}

        const schemaDB = {
            ...BaseSmartDBEntityMongo.smartDBSchema,
        };

        const schemaDatum = {
            ddPaymentPKH: { type: String, required: false },
            ddStakePKH: { type: Object, required: false },
            ddValue: { type: String, required: false },
        };

        const schema = new Schema<Interface>({
            ...schemaDB,
            ...schemaDatum,
        });

        const ModelDB = models[this._mongoTableName] || model<Interface>(this._mongoTableName, schema);
        return ModelDB;
    }

    // #endregion mongo db
}
```

**Dummy.BackEnd.Api.Handlers.Tx.ts**

The backend for new entities synced with the blockchain must extend both `BaseSmartDBBackEndApplied` and `BaseSmartDBBackEndApiHandlers`  and use the `@BackEndAppliedFor` and `@BackEndApiHandlersFor` decorators.

```
import { BackEndApiHandlersFor, BackEndAppliedFor, BaseSmartDBBackEndApiHandlers,  BaseSmartDBBackEndApplied, BaseSmartDBBackEndMethods } from 'smart-db/backEnd';
import { DummyEntity } from '../Entities/Dummy.Entity';

@BackEndAppliedFor(DummyEntity)
export class DummyBackEndApplied extends BaseSmartDBBackEndApplied {
    protected static _Entity = DummyEntity;
    protected static _BackEndMethods = BaseSmartDBBackEndMethods;
}

@Back

EndApiHandlersFor(DummyEntity)
export class DummyTxApiHandlers extends BaseSmartDBBackEndApiHandlers {
    protected static _Entity = DummyEntity;
    protected static _BackEndApplied = DummyBackEndApplied;
}
```

**Dummy.FrontEnd.Api.Calls.ts**

Classes for frontend API calls should extend `BaseSmartDBFrontEndApiCalls`.

```
import { BaseSmartDBFrontEndApiCalls } from 'smart-db';
import { DummyEntity } from '../Entities/Dummy.Entity';

export class DummyApi extends BaseSmartDBFrontEndApiCalls {
    protected static _Entity = DummyEntity;

    // #region api

    // #endregion api
}
```

## Root Backend File

To configure the backend for projects using our library, create a root backend file. This file needs to import all backend code from the test case and should be imported in any backend code file. This ensures that all decorators and registries of entities and backend handlers are loaded.

### Root Backend File Example

The example includes a Root Backend File in `src/lib/DummyExample/backEnd.ts`.

It is important to import `initBackEnd` from `smart-db/backEnd` so all registries are filled in the backend environment using the decorators that all classes have.

```
import { EndpointsManager, initBackEnd as initBackEndSmartDB } from 'smart-db/backEnd';
export * from 'smart-db/backEnd';
export * from './BackEnd/index';
export * from './Entities/index.BackEnd';

// It is very important that this file is used to import from all API endpoints 
// so that all necessary decorators of all classes are generated.

export function initBackEnd() {
    initBackEndSmartDB();
    const endpointsManager = EndpointsManager.getInstance();
    // endpointsManager.setPublicEndPointsInternet([/^\/api\/blockfrost\/.+/]);
}
```

#### Endpoints Configuration

To set any endpoint as public or private, you must set them in `initBackEnd` method in `Root Backend File`

Use an array of regex like:

```
endpointsManager.setPublicEndPointsInternet([/^\/api\/blockfrost\/.+/]);
```

By default, the library sets all endpoints as secured, accessible only with API keys.

### NextJs Api Handler Files

A minimum of two files are needed to handle all routes.

The example includes both files:

`src/pages/api/[[...query]].ts`

```
import { initBackEnd } from 'path to main backend file in project';
import { smartDBMainApiHandler } from 'smart-db/backEnd';
initBackEnd();

export const config = {
    api: {
        bodyParser: false,
    },
};

export default smartDBMainApiHandler.bind(smartDBMainApiHandler);
```

`src/pages/api/auth/[...nextauth].ts`

```
import { initBackEnd } from 'path to main backend file in project';
import { smartDBMainApiHandler } from 'smart-db/backEnd';
initBackEnd();

export const config = {
    api: {
        bodyParser: false,
    },
};

export default smartDBMainApiHandler.bind(smartDBMainApiHandler);
```

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
