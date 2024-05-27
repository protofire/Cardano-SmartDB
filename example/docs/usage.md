## Table of Contents
- [Table of Contents](#table-of-contents)
- [Usage](#usage)
  - [Familiarize Yourself](#familiarize-yourself)
  - [Wallet Connection](#wallet-connection)
    - [Wallet Creation](#wallet-creation)
  - [Faucet](#faucet)
  - [Check Balance](#check-balance)
  - [Create Dummy Datum Transaction](#create-dummy-datum-transaction)
  - [Sync Database](#sync-database)
  - [Update Datum Value](#update-datum-value)
  - [Claim Funds](#claim-funds)
  - [Transaction Modal](#transaction-modal)
- [Project Code Structure](#project-code-structure)
  - [Directories](#directories)
  - [Configuration and Contracts](#configuration-and-contracts)
  - [Components and Pages](#components-and-pages)
  - [Library Implementation and Entities files](#library-implementation-and-entities-files)
  - [API and Backend](#api-and-backend)
- [Swagger Server and UI](#swagger-server-and-ui)
  - [Run Swagger Server](#run-swagger-server)
  - [Access Swagger UI](#access-swagger-ui)
  - [Use Health Endpoint](#use-health-endpoint)
  - [Download Swagger JSON](#download-swagger-json)
- [Using Postman](#using-postman)
  - [Import JSON](#import-json)
  - [Test API in Postman: Health Endpoint](#test-api-in-postman-health-endpoint)
  - [Set Bearer Token in Postman](#set-bearer-token-in-postman)
- [Jest Tests for API](#jest-tests-for-api)
  - [Run Jest Tests](#run-jest-tests)
  - [Test Results](#test-results)
- [Setting Up New Projects](#setting-up-new-projects)
  - [Custom Entities](#custom-entities)
    - [Normal Entities](#normal-entities)
      - [Test Entity Files](#test-entity-files)
    - [Smart DB Entities](#smart-db-entities)
      - [Dummy Entity Files](#dummy-entity-files)
  - [Root Backend File](#root-backend-file)
    - [Root Backend File Example](#root-backend-file-example)
    - [Endpoints Configuration](#endpoints-configuration)
  - [NextJs Api Handler Files](#nextjs-api-handler-files)
  
## Usage

### Familiarize Yourself

Open The `Home` component, located in `src/components/public/Home/Home.tsx`, in your preferred code editor and review the code structure and functions provided.

The `Home` component is the main entry point, managing state and user interactions. It includes functions for generating scripts, managing transactions, and syncing with the blockchain.

- generateScripts: Generates the necessary scripts (minting policy and validator) for the dummy smart contract.
- getBalance: Retrieves the balance of the connected wallet.
- handleBtnCreateTx: Creates a new dummy datum transaction and saves the entity in the internal database.
- handleBtnUpdateTx: Updates the value of a dummy datum and syncs the changes with the internal database.
- handleBtnClaimTx: Claims the funds associated with a dummy datum.
- handleBtnSync: Synchronizes the local database with the blockchain state, ensuring data consistency.

The component leverages various helper functions and libraries from the Smart DB library to interact with the Cardano blockchain, manage the smart contract state, and perform database synchronization.

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

## Project Code Structure

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

### Configuration and Contracts
- `_config`: Contains configuration files for various tools within the project.
- `_smart-contracts`: Stores the Plutus files with the cbor hex code of the scripts used in the Dummy Test Example. While the code is hardcoded in the Home component, it's maintained here for reference.

### Components and Pages
- `src/components`: React components used throughout the application reside here.
- `src/pages`: New pages can be added within this directory. Essential files like `_app.tsx`, `_document.tsx`, and `index.tsx` are set up to load the `Home` component by default.

### Library Implementation and Entities files
- `src/lib/DummyExample`: Sample implementation directory for creating entities that are synced with the blockchain. This directory should contain all entity models required by a project, whether they are synced with the blockchain (like the Dummy Entity) or simply database-backed entities with full API support for the frontend and backend.

Read this section for further clarifications:
[Setting Up New Projects](#setting-up-new-projects)

### API and Backend
- `src/pages/api`: Defines the API routes and backend logic for server-side operations.

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

## Using Postman

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

## Setting Up New Projects

### Custom Entities

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

### Root Backend File

To configure the backend for projects using our library, create a root backend file. This file needs to import all backend code from the test case and should be imported in any backend code file. This ensures that all decorators and registries of entities and backend handlers are loaded.

#### Root Backend File Example

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

