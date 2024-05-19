# Smart DB Library

## Table of Contents
- [Smart DB Library](#smart-db-library)
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
  - [Installation](#installation)
  - [Usage](#usage)
  - [Directory Structure](#directory-structure)
  - [Smart DB Library Code Structure](#smart-db-library-code-structure)
    - [Entities](#entities)
    - [BackEnd](#backend)
    - [FrontEnd](#frontend)
    - [Commons](#commons)
    - [lib](#lib)
    - [hooks](#hooks)
    - [store](#store)
  - [Setting Up New Projects with Custom Entities](#setting-up-new-projects-with-custom-entities)
    - [Entities](#entities-1)
    - [BackEnd](#backend-1)
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

## Getting Started

### Prerequisites

Before you begin, ensure you have:
- Node.js (version 18.0.0 or later)
- npm (version 10.1.0 or later) or Yarn
- Basic knowledge of React and Next.js
  
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
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
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

## Installation
Currently, the library is packaged with npm. To create the package, run:
```
npm run pack
```
This command generates a file named `smart-db.tgz` in the root directory.

In the future, the package will be publicly accessible via npm. You will be able to install it with:
```
npm install smart-db
```

## Usage
To use the library, firts install the dependence

```
npm install smart-db
```

Import the necessary modules into your project:

```
import { MyModule } from 'smart-db';
```

## Directory Structure
```
├── LICENSE
├── README.md
├── assets
│   ├── img
│   └── tokens
│   └── wallet
├── package.json
├── prettier.config.cjs
├── src
│   ├── BackEnd
│   ├── Commons
│   ├── Components
│   ├── Entities
│   ├── FrontEnd
│   ├── hooks
│   ├── lib
│   ├── store
│   └── index.ts
├── tsconfig.json
└── tsconfig.server.json
```

## Smart DB Library Code Structure

The Smart DB library is organized to offer clear, modular access to its functionalities, structured as follows:

- `smart-db`: The main library entry from where to import all functionalities.
- `smart-db/backEnd`: The entry from where to import all backend functionalities.

### Entities
- `smart-db/Entities`: Entity definitions and models representing the core data structures used in the application.
  - `Base`: Core entity classes and models.
  - `Redeemers`: Scripts and logic defining how the blockchain transactions are handled.

### BackEnd
- `smart-db/BackEnd`: Contains backend logic for blockchain interactions and API handling.
  - `Base`: Base classes providing foundational backend functionality.
  - `DatabaseService`: Modules that interface with the database services like MongoDB.
  - `ApiHandlers`: Handlers for API endpoints that interact with blockchain and database.
  - `Applied`: Applied logic that binds the handlers with the blockchain and database for transactions and other operations.

### FrontEnd
- `smart-db/FrontEnd`: Contains the frontend logic for the library, facilitating interactions with the backend.
  - `ApiCalls`: API calls to backend endpoints for the library's frontend.
  - `BtnHandlers`: Button handlers for frontend UI elements, providing a bridge to backend operations.

### Commons
- `smart-db/Commons`: Shared resources and utilities across the library.
  - `BackEnd`: Contains backend utilities and handlers.
    - `apiHandlers`: Specific API handlers like `blockFrostApiHandler.ts`, `healthApiHandler.ts`, `initApiHandler.ts`, `initApiRequestWithContext.ts`, and `smartDBMainApiHandler.ts`.
    - Other backend utilities: `dbMongo.ts`, `endPointsManager.ts`, `globalBlockchainTime.ts`, `globalContext.ts`, `globalEmulator.ts`, `globalLogs.ts`, `globalLucid.ts`, `globalSettings.ts`, `globalTransactionStatusUpdater.ts`, `initGlobals.ts`, `utils.BackEnd.ts`.
  - `Constants`: Contains constant definitions like `constants.ts`, `endpoints.ts`, `images.ts`, and `wallets.ts`.
  - `Decorators`: Decorators to enhance entities with additional functionalities and integration capabilities.
  - Other common utilities: `classes.ts`, `conversions.ts`, `data.ts`, `explainError.ts`, `helpers.ts`, `index.BackEnd.ts`, `index.ts`, `pushNotification.tsx`, `show_AmountAndPrices.ts`, `types.ts`, `utils.ts`, `yupLocale.ts`.

### lib
- `smart-db/lib`: Contains sub-modules that provide specialized functionality.
  - `Auth`: Authentication modules.
  - `BlockFrost`: Modules to interact with BlockFrost API.
  - `FetchWrapper`: Modules to wrap fetch requests.
  - `Lucid`: Modules to interact with Lucid, a library for Cardano blockchain interactions.
  - `Time`: Time-related utilities and handlers.
  - Other utility modules
- 
### hooks
- `smart-db/hooks`: Contains custom hooks for various functionalities.
  - `useAppGeneral.ts`
  - `useDetails.ts`
  - `useList.ts`
  - `useLocalStorage.tsx`

### store
- `smart-db/store`: Contains state management stores for application-wide state handling.
  - `appStoreModel.ts`
  - `useGlobalStore.ts`
  - `walletStoreModel.ts`

## Setting Up New Projects with Custom Entities

### Entities

Entities must extend `BaseSmartDBEntity` and use the `@asSmartDBEntity` decorator. Fields synchronized with the database should utilize the `@Convertible({ isForDatum: true })` decorator.

**Example Entity Model**

Here's an example of how to define a new entity:
CODEtypescript
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
}
```

### FrontEnd

Classes for frontend API calls should extend `BaseSmartDBFrontEndApiCalls`.

CODEtypescript
export class DummyApi extends BaseSmartDBFrontEndApiCalls {
    protected static _Entity = DummyEntity;

    // #region api
   
    // #endregion api
}
```

### BackEnd

The backend for new entities synced with the blockchain must extend both `BaseSmartDBBackEndApplied` and `BaseSmartDBBackEndApiHandlers`:

CODEtypescript
export class DummyBackEndApplied extends BaseSmartDBBackEndApplied {
    protected static _Entity = DummyEntity;
    protected static _BackEndMethods = BaseSmartDBBackEndMethods;
}

export class DummyTxApiHandlers extends BaseSmartDBBackEndApiHandlers {
    protected static _Entity = DummyEntity;
    protected static _BackEndApplied = DummyBackEndApplied;
}
```

## Conclusion

The Smart DB library aims to bridge the gap between traditional web application development and blockchain-based data management. By abstracting complex blockchain operations into more familiar JavaScript entity interactions, it offers a developer-friendly pathway to blockchain integration. This example project is just the beginning, showcasing the potential for simplified blockchain interactions within web applications.

Remember, this is an evolving project, and future updates may introduce features like automatic synchronization after transactions are confirmed, enhancing the user experience and streamlining the development process.

## Contribution
Contributions to the Cardano Smart DB are welcome. Whether you're looking to fix bugs, add new features, or improve documentation, your help is appreciated. 

## License
This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

We express our deepest gratitude to the Cardano community for their unwavering support and valuable contributions to this project. This work is part of a funded project through Cardano Catalyst, a community-driven innovation platform. For more details on the proposal and its progress, please visit our proposal page on [IdeaScale](https://cardano.ideascale.com/c/idea/110478).
