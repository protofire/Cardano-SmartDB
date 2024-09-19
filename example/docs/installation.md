## Table of Contents
- [Table of Contents](#table-of-contents)
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
  - [Installing MongoDB](#installing-mongodb)
    - [Windows](#windows-2)
    - [macOS](#macos-1)
    - [Ubuntu](#ubuntu-1)
    - [Setting up MongoDB connection string](#setting-up-mongodb-connection-string)
      - [Localhost (default)](#localhost-default)
      - [Docker](#docker)
      - [WSL (Windows Subsystem for Linux)](#wsl-windows-subsystem-for-linux)
      - [Remote MongoDB Server](#remote-mongodb-server)
  - [Installing PostgreSQLDB](#installing-postgresql)
    - [Windows](#windows-3)
    - [macOS](#macos-2)
    - [Ubuntu](#ubuntu-2)
    - [Setting up PostgreSQLDB connection string](#setting-up-postgresql-connection)
      - [Localhost (default)](#localhost-default-1)
      - [Docker](#docker-1)
      - [WSL (Windows Subsystem for Linux)](#wsl-windows-subsystem-for-linux-1)
      - [Remote PostgreSQLDB Server](#remote-postgresql-server)
- [Installation of the example Project](#installation-of-the-example-project)
- [Environment Setup](#environment-setup)
- [Run the Application in developer mode](#run-the-application-in-developer-mode)
- [Build and Run Application](#build-and-run-application)

## Getting Started

### Prerequisites

Before you begin, ensure you have:
- Node.js (version 18.0.0 or later)
- npm (version 10.1.0 or later) or Yarn
- Basic knowledge of React and Next.js
- Blockfrost API Keys
- Mongo or PostgreSQL database (installation instructions below)
- [Cardano-SmartDB-Scaffold](https://github.com/protofire/Cardano-SmartDB-Scaffold) (installation instructions below)

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

Only one Blockfrost API key is needed, corresponding to the network set in `NEXT_PUBLIC_CARDANO_NET` variable.

The configuration for the `.env.local` file is explained in detail in the following section of this [Environment Setup](#environment-setup).

### Installing MongoDB

#### Windows

1. Download the MongoDB installer from the [official MongoDB website](https://www.mongodb.com/try/download/community).
2. Run the installer and follow the prompts.
3. Configure MongoDB as a Windows service.

#### macOS

1. If Homebrew is not installed, install it first from [Homebrew's website](https://brew.sh/).
2. Install MongoDB using Homebrew:

```
brew tap mongodb/brew
brew install mongodb-community@5.0
```

3. Start MongoDB:

```
brew services start mongodb/brew/mongodb-community
```

#### Ubuntu

1. Import the MongoDB public GPG Key:

```
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
```

2. Create a list file for MongoDB:

```
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
```

3. Reload local package database:

```
sudo apt update
```

4. Install MongoDB packages:

```
sudo apt install -y mongodb-org
```

5. Start MongoDB:

```
sudo systemctl start mongod
sudo systemctl enable mongod
```

 #### Setting up MongoDB connection string

The `MONGO_URLDB` environment variable should contain the MongoDB connection string. 

The configuration for the `.env.local` file is explained in detail in the following section of this [Environment Setup](#environment-setup).

Here are examples of how to set it up in different environments:

##### Localhost (default)
If MongoDB is installed locally on your machine:
```
MONGO_URLDB=mongodb://localhost:27017/your-database-name
```

##### Docker
If you are running MongoDB inside a Docker container:
```
MONGO_URLDB=mongodb://<docker-container-ip>:27017/your-database-name
```
Replace `<docker-container-ip>` with the actual IP address of your Docker container.

##### WSL (Windows Subsystem for Linux)
To get the IP address of the Windows host from WSL, use the following command:
```
cat /etc/resolv.conf
```
Use the IP address found in the output to set up the MongoDB connection string:
```
MONGO_URLDB=mongodb://<windows-ip>:27017/your-database-name
```

##### Remote MongoDB Server
If you are connecting to a remote MongoDB server:
```
MONGO_URLDB=mongodb://<remote-server-ip>:27017/your-database-name
```
Replace `<remote-server-ip>` with the actual IP address of your remote MongoDB server.

After setting these variables, your application will be configured to communicate with the specified Cardano network and utilize the necessary services and databases.

### Installing PostgreSQL

#### Windows

1. Download the PostgreSQL installer from the [official PostgreSQL website](https://www.postgresql.org/download/windows/).
2. Run the installer and follow the prompts.
3. During installation, make sure to install pgAdmin as it provides a graphical interface for managing your PostgreSQL databases.
4. Configure PostgreSQL as a Windows service (this is usually done by default).

#### macOS

1. If Homebrew is not installed, install it first from [Homebrew's website](https://brew.sh/).
2. Install PostgreSQL using Homebrew:

   ```
   brew install postgresql
   ```

3. Start PostgreSQL:

   ```
   brew services start postgresql
   ```

4. Initialize the database (if required):

   ```
   initdb /usr/local/var/postgres
   ```

#### Ubuntu

1. Update your package list:

   ```
   sudo apt update
   ```

2. Install PostgreSQL:

   ```
   sudo apt install postgresql postgresql-contrib
   ```

3. Start PostgreSQL:

   ```
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

4. Optionally, switch to the PostgreSQL user to create a new database:

   ```
   sudo -i -u postgres
   ```

   And create a new database:

   ```
   createdb your-database-name
   ```

#### Setting up PostgreSQL connection

You need to configure the following environment variables to connect to your PostgreSQL database:

- `POSTGRES_HOST`: The host where PostgreSQL is running (e.g., `localhost` or an IP address).
- `POSTGRES_PORT`: The port PostgreSQL is listening on (default is `5432`).
- `POSTGRES_USER`: The username used to connect to the database.
- `POSTGRES_PASS`: The password for the PostgreSQL user.
- `POSTGRES_DB`: The name of the database you want to connect to.

Here are examples of how to set these variables in different environments:

##### Localhost (default)
If PostgreSQL is installed locally on your machine:
```
POSTGRES_HOST="localhost"
POSTGRES_PORT=5432
POSTGRES_USER="your-username"
POSTGRES_PASS="your-password"
POSTGRES_DB="your-database-name"
```

##### Docker
If you are running PostgreSQL inside a Docker container:
```
POSTGRES_HOST="<docker-container-ip>"
POSTGRES_PORT=5432
POSTGRES_USER="your-username"
POSTGRES_PASS="your-password"
POSTGRES_DB="your-database-name"
```
Replace `<docker-container-ip>` with the actual IP address of your Docker container.

##### WSL (Windows Subsystem for Linux)
To get the IP address of the Windows host from WSL, use the following command:
```
cat /etc/resolv.conf
```
Use the IP address found in the output to set up the PostgreSQL connection:
```
POSTGRES_HOST="<windows-ip>"
POSTGRES_PORT=5432
POSTGRES_USER="your-username"
POSTGRES_PASS="your-password"
POSTGRES_DB="your-database-name"
```

##### Remote PostgreSQL Server
If you are connecting to a remote PostgreSQL server:
```
POSTGRES_HOST="<remote-server-ip>"
POSTGRES_PORT=5432
POSTGRES_USER="your-username"
POSTGRES_PASS="your-password"
POSTGRES_DB="your-database-name"
```
Replace `<remote-server-ip>` with the actual IP address of your remote PostgreSQL server.

After setting these variables, your application will be configured to communicate with the specified PostgreSQL database.

## Installation of the example Project

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


4. **Update Library**

In this example we are using the library package as a tar file.

```
npm install ../smart-db.tgz --force
```

- **Note:** Ensure that the library was packed before.

[Download, Build and Pack the library](../../docs/installation.md#download-build-and-pack-the-library)

## Installation of the [Cardano-SmartDB-Scaffold](https://github.com/protofire/Cardano-SmartDB-Scaffold)
Refer to [Cardano-SmartDB-Scaffold installation](https://github.com/protofire/Cardano-SmartDB-Scaffold/blob/main/README.md#installation)
## Environment Setup

Create a `.env.local` file at the root of your project by copying the contents from the `.env` template file. 

Adjust the environment variables according to your project's needs:

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
- `USE_DATABASE`: Type of database used, such as 'mongo' for MongoDB or 'postgresql' for PostgreSQL.
- `MONGO_URLDB`: MongoDB connection string.
- `POSTGRES_HOST`: The host where PostgreSQL is running (e.g., `localhost` or an IP address).
- `POSTGRES_PORT`: The port PostgreSQL is listening on (default is `5432`).
- `POSTGRES_USER`: The username used to connect to the database.
- `POSTGRES_PASS`: The password for the PostgreSQL user.
- `POSTGRES_DB`: The name of the database you want to connect to.

- `SWAGGER_PORT`: The Swagger server port

**Note:** Only one Blockfrost API key is needed, corresponding to the network set in `NEXT_PUBLIC_CARDANO_NET`.

## Run the Application in developer mode

```
npm run dev
# Or for Yarn users
yarn dev
```

Visit `http://localhost:3000` in your browser to view the application in developer mode.

**Additional Notes:**

It's important to ensure that all environment variables set in your `.env.local` file are compatible with your production environment. 

## Build and Run Application

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

It's important to ensure that all environment variables set in your `.env.local` file are compatible with your production environment. 
