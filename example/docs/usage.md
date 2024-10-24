## Table of Contents
- [Table of Contents](#table-of-contents)
- [Usage](#usage)
  - [Familiarize Yourself](#familiarize-yourself)
  - [Wallet Connection](#wallet-connection)
    - [Wallet Creation](#wallet-creation)
  - [Faucet](#faucet)
  - [Check Balance](#check-balance)
  - [Create Dummy Transaction](#create-dummy-transaction)
  - [Update Dummy Transaction](#update-dummy-transaction)
  - [Claim Dummy Transaction](#claim-dummy-transaction)
  - [Sync Database](#sync-database)
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
  - [Optimization Tips for PostgreSQL Entities](#optimization-tips-for-postgresql-entities)
  - [Scaffold for Automating Entity and File Creation](#scaffold-for-automating-entity-and-file-creation)
    - [How to Use](#how-to-use)
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
- handleBtnCreateTx: Creates a new dummy datum transaction, and the sync process saves the entity in the internal database.
- handleBtnUpdateTx: Updates the value of a dummy datum, and the sync process updates the internal database.
- handleBtnClaimTx: Claims the funds associated with a dummy datum and deletes the datum. The sync process also deletes it in the internal database.
- handleBtnSync: (Deprecated) This button was used to manually synchronize the local database with the blockchain state. With the new automatic sync process, this button is no longer needed, but it remains for backward compatibility or manual sync if ever required.

The component leverages various helper functions and libraries from the Smart DB library to interact with the Cardano blockchain, manage the smart contract state, and perform database synchronization.

### Wallet Connection 

A new wallet connector button and modal allow users to connect with browser extension wallets (like Eternl, Yoroi) or by using a private key. After connecting, there is a button to get an API key in the wallet connected modal.

#### Wallet Creation

A new wallet is generated on the fly by creating a random private key. You can save this private key for future use to retain the same ADA and tokens associated with the wallet.

### Faucet

Click the "Faucet" button to obtain testnet ADA for transaction fees.

### Check Balance

Click the "Refresh Balance" button to check the wallet's balance.

### Create Dummy Transaction

This transaction will create a new UTXO in the validator address with a datum. This datum will have a value set in its fields. The automatic synchronization process will sync this UTXO datum with a new entry in the table Dummy in the internal database.

1. Enter a value in the input field provided. This value will be saved in the UTXO Datum.
2. Click "Create" to initiate the transaction.
3. If you are using a wallet connected, you need to sign the transaction with your wallet in the upcoming modal.
4. A modal will display the transaction status and details.
   
### Update Dummy Transaction

This transaction will consume the old UTXO from the validator address and create a new UTXO with a new datum. This action is restricted to the datum's creator per the validator script's logic. The new datum will have the updated value set in its fields. The automatic synchronization process will sync this UTXO datum with an entry in the table Dummy in the internal database. The internal database will delete the old entry and create a new one to ensure both entities, in the database and on the blockchain, are the same.

1. Click "Update" next to the datum you want to modify.
2. Enter a new value and click "Save".
3. If you are using a wallet connected, you need to sign the transaction with your wallet in the upcoming modal.
4. A modal will show the transaction status.

   
### Claim Dummy Transaction

This transaction will consume the old UTXO with the datum from the validator address. Because it is not generating a new one, this datum will be deleted. This action is restricted to the datum's creator per the validator script's logic. The automatic sync process will delete the entry also in the internal database.

1. Click "Claim" to transfer the funds associated with a dummy entity to your wallet.
2. If you are using a wallet connected, you need to sign the transaction with your wallet in the upcoming modal.
3. A modal will show the transaction status.

### Sync Database

The synchronization process will initiate automatically when a transaction is confirmed, ensuring that the application's internal database is updated with the latest blockchain state. However, users can also trigger the synchronization manually if needed.

To manually sync the latest blockchain state with the internal database, users can click the "Sync" button within the application. This action fetches the current state of the blockchain and updates the local database accordingly.

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
│       ├── Commons
│       |   ├── Constants
│       |   │   ├── transactions.ts
│       └── SmartDB
│           ├── BackEnd
│           │   ├── Dummy.BackEnd.Api.Handlers.ts
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
- `src/lib/SmartDB`: Sample implementation directory for creating entities that are synced with the blockchain. This directory should contain all entity models required by a project, whether they are synced with the blockchain (like the Dummy Entity) or simply database-backed entities with full API support for the frontend and backend.

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
__tests__/api/testResults.csv
```

## Setting Up New Projects

### Custom Entities

Entities in Smart DB Library can be classified into two types: normal entities and Smart DB entities.

#### Normal Entities

Normal entities are standard database entities with frontend API calls and backend code, and they have a presence in the database.

The example includes a new normal entity called "Test Entity". This is a simple entity with a database backend, not linked to blockchain datums, making it easy to test all API endpoints. To create a normal entity, follow the example below:

##### Test Entity Files

- **Entity Definition**: Located at `exame/src/lib/SmartDB/Entities/Test.Entity.ts`
- **MongoDB Model**: Located at `src/lib/SmartDB/Entities/Test.Entity.Mongo.ts`
- **Backend Handlers**: Located at `src/lib/SmartDB/BackEnd/Test.BackEnd.Api.Handlers.ts`
- **Frontend API Calls**: Located at `src/lib/SmartDB/FrontEnd/Test.FrontEnd.Api.Calls.ts`

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

**Test.Entity.PostgreSQL.ts**

Classes for PostgreSQL Schemma should extend `BaseEntityPostgreSQL` and use the `@PostgreSQLAppliedFor` decorator.  
```
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TestEntity } from './Test.Entity';
import { PostgreSQLAppliedFor, getPostgreSQLTableName, Maybe } from 'smart-db';
import { BaseEntityPostgreSQL  } from 'smart-db/backEnd';
import { type PaymentKeyHash,  } from 'lucid-cardano';

@PostgreSQLAppliedFor([TestEntity])
@Entity({ name: getPostgreSQLTableName(TestEntity.className()) })
@Index(['testIndex', ]) // Add indices as needed
export class TestEntityPostgreSQL extends BaseEntityPostgreSQL  {
    protected static Entity = TestEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof TestEntityPostgreSQL {
        return this.constructor as typeof TestEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof TestEntityPostgreSQL {
        return this as typeof TestEntityPostgreSQL;
    }

    public getStatic(): typeof TestEntity {
        return TestEntityPostgreSQL.getPostgreSQLStatic().getStatic() as typeof TestEntity;
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

    // #endregion internal class methods

    // #region fields

    @PrimaryGeneratedColumn()
    _id!: number; // Auto-generated primary key

    @Column({ type: "varchar", length: 255  })
    name!: PaymentKeyHash ;
    @Column({ type: "varchar", length: 255  })
    description!: Maybe<PaymentKeyHash> ;

    public static PostgreSQLModel() {
        return this;
    }
    // #endregion fields
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

- **Entity Definition**: Located at `src/lib/SmartDB/Entities/Dummy.Entity.ts`
- **MongoDB Model**: Located at `src/lib/SmartDB/Entities/Dummy.Entity.Mongo.ts`
- **PostgreSQL Model**: Located at `src/lib/SmartDB/Entities/Dummy.Entity.PostgreSQL.ts`
- **Backend Handlers**: Located at `src/lib/SmartDB/BackEnd/Dummy.BackEnd.Api.Handlers.ts`
- **Frontend API Calls**: Located at `src/lib/SmartDB/FrontEnd/Dummy.FrontEnd.Api.Calls.ts`

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
**Dummy.Entity.PostgreSQL.ts**

Classes for PostgreSQL Schemma should extend `BaseSmartDBEntityPostgreSQL` and use the `@PostgreSQLAppliedFor` decorator.  

```
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { DummyEntity } from './Dummy.Entity';
import { PostgreSQLAppliedFor, getPostgreSQLTableName, Maybe, StakeCredentialPubKeyHash } from 'smart-db';
import {  BaseSmartDBEntityPostgreSQL } from 'smart-db/backEnd';
import { type PaymentKeyHash,  } from 'lucid-cardano';

@PostgreSQLAppliedFor([DummyEntity])
@Entity({ name: getPostgreSQLTableName(DummyEntity.className()) })
@Index(['ddPaymentPKH', ]) // Add indices as needed
export class DummyEntityPostgreSQL extends  BaseSmartDBEntityPostgreSQL {
    protected static Entity = DummyEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof DummyEntityPostgreSQL {
        return this.constructor as typeof DummyEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof DummyEntityPostgreSQL {
        return this as typeof DummyEntityPostgreSQL;
    }

    public getStatic(): typeof DummyEntity {
        return DummyEntityPostgreSQL.getPostgreSQLStatic().getStatic() as typeof DummyEntity;
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

    // #region fields

    @PrimaryGeneratedColumn()
    _id!: number; // Auto-generated primary key

    @Column({ type: "varchar", length: 255  })
    _NET_id_TN!:string;
    @Column({ type: "varchar", length: 255  })
    ddPaymentPKH!: PaymentKeyHash ;
    @Column({ type: "varchar", length: 255  })
    ddStakePKH!: Maybe<StakeCredentialPubKeyHash> ;
    @Column({ type: "int"  })
    ddValue!:number;

    public static PostgreSQLModel() {
        return this;
    }
    // #endregion fields
}
```


**Dummy.BackEnd.Api.Handlers.ts**

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


    // #region custom api handlers
    // #endregion custom api handlers

    // #region api tx handlers
    // #endregion api tx handlers

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
### Optimization Tips for PostgreSQL Entities

1. **Indexing**:
   - Proper use of indexes is crucial for optimizing query performance. In PostgreSQL, indexes speed up data retrieval significantly. Consider adding indexes on columns that are frequently queried or used in `WHERE`, `JOIN`, or `ORDER BY` clauses.
   - Example: `@Index(['name'])` to index the `name` column, improving search efficiency.

2. **Column Types**:
   - Choosing the right column types can optimize both storage and performance. For example, using `varchar` for text columns is fine, but if the text is small and constrained in length, `char` may be more efficient.
   - In the case of dates or timestamps, use the appropriate types like `timestamp` or `date` to avoid extra storage overhead.

3. **Batch Inserts and Updates**:
   - If you're performing bulk inserts or updates, consider batching them instead of doing them one by one. This reduces the overhead of multiple round-trips to the database.

4. **Normalization and Joins**:
   - Ensure your entities are properly normalized. Avoid redundant data where possible and use foreign keys to link related entities.
   - However, be cautious with deep nested relationships, as multiple joins can slow down queries.

5. **Pagination**:
   - If your entity will return large result sets, consider implementing pagination to retrieve data in chunks instead of loading everything at once. This can improve both performance and user experience.
   - Use `LIMIT` and `OFFSET` wisely to fetch data in parts.

6. **Foreign Key Constraints**:
   - Use foreign key constraints for better data integrity, but be mindful of cascading updates or deletes, as they may impact performance if not managed properly.

By carefully planning your entity schema and optimizing queries with these practices, you'll improve both performance and maintainability of your database interactions.

### Scaffold for Automating Entity and File Creation

If you wish, you can use the scaffold to automate the creation of entities and their related files. This tool simplifies the process of generating the necessary components for new entities, allowing you to focus on core functionality.

The scaffold will automatically generate:
- Entity models
- GraphQL schemas
- Service files
- API routes (if applicable)
- Configuration files

#### How to Use

To start using the scaffold, follow the steps in the [Cardano-SmartDB-Scaffold Usage](https://github.com/protofire/Cardano-SmartDB-Scaffold/blob/main/README.md#usage).

This tool will help you maintain consistency, reduce manual file creation, and speed up development.

Feel free to utilize the scaffold to streamline your project!

### Root Backend File

To configure the backend for projects using our library, create a root backend file. This file needs to import all backend code from the project. This ensures that all decorators and registries of entities and backend handlers are loaded.

#### Root Backend File Example

The example includes a Root Backend File in `src/lib/SmartDB/backEnd.ts`.

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

