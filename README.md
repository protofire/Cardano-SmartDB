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
  - [Example Project](#example-project)
    - [Running the Example Project](#running-the-example-project)
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
The Smart DB Library is a Node.js package designed to simplify the interaction between JavaScript entities, a database, and the Cardano blockchain. It enables developers to work with entities backed by a database and synced with the blockchain, providing a transparent and seamless experience.

## Features
- **Hooks and Stores**: Provides useHooks and EasyPeasy stores to deal with wallet connection.
- **Seamless Blockchain Integration**: Simplify interactions with the Cardano blockchain using JavaScript entities.
- **Manual Synchronization**: Users must manually synchronize the application after transactions are confirmed to reflect the latest blockchain state in the internal database.
- **Authorization**: All API endpoints are secured with authorization logic using Next.js sessions and JWT tokens.
- **API Handling**: The library handles all API routes, reducing the complexity in the projects that use our library.
- **Example Project**: Includes a comprehensive example project in the `example` folder demonstrating the use of the library.
- **Node.js Dependency**: This is a Node.js library to add as a dependency in dApps projects.

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

1. **Clone the Repository**

```
git clone git@github.com:protofire/Cardano-SmartDB.git
cd Cardano-SmartDB
```


2. **Install Dependencies**

```
   npm install
   # Or if you use Yarn
   yarn install
```

2. **Pack the library**
   
Currently, the library is packaged with npm. To create the package, run:

```
npm run pack
```

This command generates a file named `smart-db.tgz` in the root directory.

In the future, the package will be publicly accessible via npm. 

## Usage

To use the library in your project, follow these steps:

1. Create a new project:

```
npx create-next-app my-dapp
cd my-dapp
```

2. Install the library.

Now, the library is packaged in the file. To install use:

```
npm install ../smart-db.tgz 
```

In the future, the package will be publicly accessible via npm. To install:

```
npm install smart-db.tgz 
```

4. Import the necessary modules into your project:

```
import { MyModule } from 'smart-db';
```

5. Use the library's functionalities as needed within your application.

6. To create normal and Smart DB entities, refer to the detailed sections in this README. 
[Setting Up New Projects with Custom Entities](#setting-up-new-projects-with-custom-entities)

7. To create a root backend file that imports all the backend and defines the `initBackEnd` function, refer to the "Root Backend File" section in this README.
[Root Backend File](#root-backend-file)

8. To set up the NexthJs API Handler files, a minimum of two files are needed. Refer to the detailed sections in this README. 
[NextJs Api Handler Files](#nextjs-api-handler-files)

## Example Project

The `example` folder within the library contains a comprehensive Next.js project that demonstrates how to use the Smart DB library. This example project serves as a template and provides practical implementations for various features.

### Running the Example Project

To navigate to the example project and run it:

```
cd example
npm install
npm run dev
```

Visit `http://localhost:3000` in your browser to view the example project in action. For detailed instructions on how to use the example project, refer to its README file located within the `example` folder.

## Directory Structure

```
├── LICENSE
├── README.md
├── assets
│   ├── img
│   └── tokens
│   └── wallet
├── example
│   ├── __tests__
│   ├── _config
│   ├── _smart-contracts
│   ├── _swagger
│   ├── jest.config.js
│   ├── next-env.d.ts
│   ├── next.config.js
│   ├── package-lock.json
│   ├── package.json
│   ├── pages-manifest.json
│   ├── prettier.config.js
│   ├── public
│   ├── src
│   ├── pages
│   ├── styles
│   ├── tsconfig.json
│   ├── tsconfig.server.json
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
  - Other utility modules.

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

Entities in Smart DB Library can be classified into two types: normal entities and Smart DB entities.

#### Normal Entities

Normal entities are standard database entities with frontend API calls and backend code, and they have a presence in the database.

The example includes a new normal entity called "Test Entity". This is a simple entity with a database backend, not linked to blockchain datums, making it easy to test all API endpoints. To create a normal entity, follow the example below:

##### Test Entity Files

- **Entity Definition**: Located at `example/src/lib/DummyExample/Entities/Test.Entity.ts`
- **MongoDB Model**: Located at `example/src/lib/DummyExample/Entities/Test.Entity.Mongo.ts`
- **Backend Handlers**: Located at `example/src/lib/DummyExample/BackEnd/Test.BackEnd.Api.Handlers.ts`
- **Frontend API Calls**: Located at `example/src/lib/DummyExample/FrontEnd/Test.FrontEnd.Api.Calls.ts`

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
    protected static

 _Entity = TestEntity;
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

- **Entity Definition**: Located at `example/src/lib/DummyExample/Entities/Dummy.Entity.ts`
- **MongoDB Model**: Located at `example/src/lib/DummyExample/Entities/Dummy.Entity.Mongo.ts`
- **Backend Handlers**: Located at `example/src/lib/DummyExample/BackEnd/Dummy.BackEnd.Api.Handlers.Tx.ts`
- **Frontend API Calls**: Located at `example/src/lib/DummyExample/FrontEnd/Dummy.FrontEnd.Api.Calls.ts`

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

@BackEndApiHandlersFor(DummyEntity)
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

The example includes a Root Backend File in `example/src/lib/DummyExample/backEnd.ts`. 

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

### Endpoints Configuration

To set any endpoint as public or private, you must set them in `initBackEnd` method in `Root Backend File`

Use and array of regex like:

```
endpointsManager.setPublicEndPointsInternet([/^\/api\/blockfrost\/.+/]);
```

By default, the library sets all endpoints as secured, accessible only with API keys.


## NextJs Api Handler Files

A minimum of two files are needed to handle all routes.

The example includes both files: 

`example/src/pages/api/[[...query]].ts`

```
import { initBackEnd } from 'path to main backend file in project';
import { smartDBMainApiHandler } from 'smart-db/backEnd';
initBackEnd

();

export const config = {
    api: {
        bodyParser: false,
    },
};

export default smartDBMainApiHandler.bind(smartDBMainApiHandler);

```

`example/src/pages/api/auth/[...nextauth].ts`
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

The Smart DB library aims to bridge the gap between traditional web application development and blockchain-based data management. By abstracting complex blockchain operations into more familiar JavaScript entity interactions, it offers a developer-friendly pathway to blockchain integration. This example project is just the beginning, showcasing the potential for simplified blockchain interactions within web applications.

Remember, this is an evolving project, and future updates may introduce features like automatic synchronization after transactions are confirmed, enhancing the user experience and streamlining the development process.

## Contribution

Contributions to the Cardano Smart DB are welcome. Whether you're looking to fix bugs, add new features, or improve documentation, your help is appreciated.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

We express our deepest gratitude to the Cardano community for their unwavering support and valuable contributions to this project. This work is part of a funded project through Cardano Catalyst, a community-driven innovation platform. For more details on the proposal and its progress, please visit our proposal page on [IdeaScale](https://cardano.ideascale.com/c/idea/110478).
