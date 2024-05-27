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

## Download, build and Pack the library

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
