
## Table of Contents
- [Table of Contents](#table-of-contents)
- [Directory Structure](#directory-structure)
- [Smart DB Library Code Structure](#smart-db-library-code-structure)
  - [Entities](#entities)
  - [BackEnd](#backend)
  - [FrontEnd](#frontend)
  - [Commons](#commons)
  - [lib](#lib)
  - [hooks](#hooks)
  - [store](#store)
- [Setting Up New Projects](#setting-up-new-projects)
  - [Usage of the library](#usage-of-the-library)
  - [Example Project](#example-project)
    - [Running the Example Project](#running-the-example-project)
  - [Custom Entities](#custom-entities)
    - [Normal Entities](#normal-entities)
      - [Test Entity Files](#test-entity-files)
    - [Smart DB Entities](#smart-db-entities)
      - [Dummy Entity Files](#dummy-entity-files)
  - [Root Backend File](#root-backend-file)
    - [Root Backend File Example](#root-backend-file-example)
    - [Endpoints Configuration](#endpoints-configuration)
  - [NextJs Api Handler Files](#nextjs-api-handler-files)

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
│   └── index.ts <Main entry file>
│   └── backEnd.ts <Main Backend entry file>
├── tsconfig.json
└── tsconfig.server.json
```

## Smart DB Library Code Structure

The library source code resides in the `/src` folder.

The Smart DB library is organized to offer clear, modular access to its functionalities, structured as follows:

- `/src/index.ts`: The main library file where all frontend functionalities are exported.
- `/src/backEnd.ts`: The main library file where all backend functionalities are exported.

### Entities
- `/src/Entities`: Entity definitions and models representing the core data structures used in the application.
  - `Base`: Core entity classes and models.
  - `Redeemers`: Scripts and logic defining how the blockchain transactions are handled.

### BackEnd
- `/src/BackEnd`: Contains backend logic for blockchain interactions and API handling.
  - `Base`: Base classes providing foundational backend functionality.
  - `DatabaseService`: Modules that interface with the database services like MongoDB or PostgreSQL.
  - `ApiHandlers`: Handlers for API endpoints that interact with blockchain and database.
  - `Applied`: Applied logic that binds the handlers with the blockchain and database for transactions and other operations.

### FrontEnd
- `/src/FrontEnd`: Contains the frontend logic for the library, facilitating interactions with the backend.
  - `ApiCalls`: API calls to backend endpoints for the library's frontend.
  - `BtnHandlers`: Button handlers for frontend UI elements, providing a bridge to backend operations.

### Commons
- `/src/Commons`: Shared resources and utilities across the library.
  - `BackEnd`: Contains backend utilities and handlers.
    - `apiHandlers`: Specific API handlers like `blockFrostApiHandler.ts`, `healthApiHandler.ts`, `initApiHandler.ts`, `initApiRequestWithContext.ts`, and `smartDBMainApiHandler.ts`.
    - Other backend utilities: `dbPostgreSQL.ts`,`dbMongo.ts`, `endPointsManager.ts`, `globalBlockchainTime.ts`, `globalContext.ts`, `globalEmulator.ts`, `globalLogs.ts`, `globalLucid.ts`, `globalSettings.ts`, `globalTransactionStatusUpdater.ts`, `initGlobals.ts`, `utils.BackEnd.ts`.
  - `Constants`: Contains constant definitions like `constants.ts`, `endpoints.ts`, `images.ts`, and `wallets.ts`.
  - `Decorators`: Decorators to enhance entities with additional functionalities and integration capabilities.
  - Other common utilities: `classes.ts`, `conversions.ts`, `data.ts`, `explainError.ts`, `helpers.ts`, `index.BackEnd.ts`, `index.ts`, `pushNotification.tsx`, `show_AmountAndPrices.ts`, `types.ts`, `utils.ts`, `yupLocale.ts`.

### lib
- `/src/lib`: Contains sub-modules that provide specialized functionality.
  - `Auth`: Authentication modules.
  - `BlockFrost`: Modules to interact with BlockFrost API.
  - `FetchWrapper`: Modules to wrap fetch requests.
  - `Lucid`: Modules to interact with Lucid, a library for Cardano blockchain interactions.
  - `Time`: Time-related utilities and handlers.
  - Other utility modules.

### hooks
- `/src/hooks`: Contains custom hooks for various functionalities.
  - `useAppGeneral.ts`
  - `useDetails.ts`
  - `useList.ts`
  - `useLocalStorage.tsx`

### store
- `/src/store`: Contains state management stores for application-wide state handling.
  - `appStoreModel.ts`
  - `useGlobalStore.ts`
  - `walletStoreModel.ts`

## Setting Up New Projects

### Usage of the library

To use the library in a new project, follow these steps:

1. Create a project:

```
npx create-next-app my-dapp
cd my-dapp
```

2. Install the library

Now, the library is packaged into a file. To install use:

```
npm install ../smart-db.tgz 
```

In the future, the package will be publicly accessible via npm. To install use:

```
npm install smart-db
```

3. Import the necessary modules into your project:

```
import { any frontend module } from 'smart-db';
import { any backend module } from 'smart-db/backEnd';
```

4. To create normal and Smart DB entities, refer to the detailed sections in this README. 
[Custom Entities](#custom-entities)

5. To create a root backend file that imports all the backend and defines the `initBackEnd` function, refer to the "Root Backend File" section in this README.
[Root Backend File](#root-backend-file)

6. To set up the NexthJs API Handler files, a minimum of two files are needed. Refer to the detailed sections in this README. 
[NextJs Api Handler Files](#nextjs-api-handler-files)

7. Use the library's functionalities as needed within your application.

### Example Project

The `example` folder within the library contains a comprehensive Next.js project that demonstrates how to use the Smart DB library. This example project serves as a template and provides practical implementations for various features.

#### Running the Example Project

To navigate to the example project and run it:

```
cd example
npm install
npm run dev
```

Visit `http://localhost:3000` in your browser to view the example project in action. 

For detailed instructions on how to use the example project, refer to its [README](../example/README.md) file located within the `example` folder or [GitBook](https://protofire-docs.gitbook.io/smartdb-example).

### Custom Entities

Entities in Smart DB Library can be classified into two types: normal entities and Smart DB entities.

#### Normal Entities

Normal entities are standard database entities with frontend API calls and backend code, and they have a presence in the database.

The example includes a new normal entity called "Test Entity". This is a simple entity with a database backend, not linked to blockchain datums, making it easy to test all API endpoints. To create a normal entity, follow the example below:

##### Test Entity Files

- **Entity Definition**: Located at `example/src/lib/SmartDB/Entities/Test.Entity.ts`
- **MongoDB Model**: Located at `example/src/lib/SmartDB/Entities/Test.Entity.Mongo.ts`
- **PostgreSQL Model**: Located at `example/src/lib/SmartDB/Entities/Test.Entity.PostgreSQL.ts`
- **Backend Handlers**: Located at `example/src/lib/SmartDB/BackEnd/Test.BackEnd.Api.Handlers.ts`
- **Frontend API Calls**: Located at `example/src/lib/SmartDB/FrontEnd/Test.FrontEnd.Api.Calls.ts`

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

- **Entity Definition**: Located at `example/src/lib/SmartDB/Entities/Dummy.Entity.ts`
- **MongoDB Model**: Located at `example/src/lib/SmartDB/Entities/Dummy.Entity.Mongo.ts`
- **PostgreSQL Model**: Located at `example/src/lib/SmartDB/Entities/Dummy.Entity.PostgreSQL.ts`
- **Backend Handlers**: Located at `example/src/lib/SmartDB/BackEnd/Dummy.BackEnd.Api.Handlers.Tx.ts`
- **Frontend API Calls**: Located at `example/src/lib/SmartDB/FrontEnd/Dummy.FrontEnd.Api.Calls.ts`

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

### Root Backend File

To configure the backend for projects using our library, create a root backend file. This file needs to import all backend code from the test case and should be imported in any backend code file. This ensures that all decorators and registries of entities and backend handlers are loaded.

#### Root Backend File Example

The example includes a Root Backend File in `example/src/lib/SmartDB/backEnd.ts`. 

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

Use and array of regex like:

```
endpointsManager.setPublicEndPointsInternet([/^\/api\/blockfrost\/.+/]);
```

By default, the library sets all endpoints as secured, accessible only with API keys.


### NextJs Api Handler Files

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
