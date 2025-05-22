# Auraweave - Decentralized Data Marketplace

Auraweave is a decentralized platform for buying and selling data. It leverages blockchain technology (Ethereum) for managing data listings and facilitating transactions, and IPFS (InterPlanetary File System) for distributed data storage. This project provides the smart contracts, backend agents (producer and consumer), and a foundational frontend for interacting with the marketplace.

## Project Structure

The project is organized into two main directories:

*   `backend/`: Contains all the backend components of the Auraweave platform.
    *   `contracts/`: Holds the Solidity smart contracts, primarily `DataRegistry.sol` which is the core of the marketplace.
    *   `agents/`: Contains Python scripts for a `producer_agent` (lists data) and a `consumer_agent` (buys data).
    *   `scripts/`: Includes deployment scripts for the smart contracts (e.g., `deploy.js`).
    *   `ignition/`: Hardhat Ignition modules for deployment (e.g. `Lock.js`).
    *   `test/`: Tests for the smart contracts.
*   `frontend/`: Contains the user interface for interacting with Auraweave.
    *   `src/`: The source code for the React application, built with Vite and TypeScript.
        *   `components/`: Reusable UI components for the frontend.
        *   `App.tsx`: The main application component.
        *   `main.tsx`: The entry point for the React application.

Each directory has its own specific READMEs and configuration files where applicable.

## Backend Components

The backend is responsible for the core logic of the data marketplace, including smart contracts for on-chain operations and Python agents for off-chain processes.

### Smart Contracts

Located in `backend/contracts/`:

*   **`DataRegistry.sol`**: This is the central smart contract for Auraweave.
    *   It allows users (sellers) to list their data by providing metadata such as name, description, the IPFS Content Identifier (CID) where the data is stored, and a price in ETH.
    *   Emits a `DataListed` event upon successful listing.
    *   Allows users (buyers) to purchase data by sending the required ETH to the contract.
    *   Handles the transfer of ETH to the seller upon successful purchase.
    *   Emits a `DataPurchased` event upon successful purchase.
    *   Provides functions to retrieve details of active listings.
*   **`Lock.sol`**: This is a sample contract provided by Hardhat. It demonstrates a basic time-locked wallet. It is not a core component of the Auraweave data marketplace functionality but is included as part of the default Hardhat project setup.

Smart contracts are developed and managed using [Hardhat](https://hardhat.org/).

### Python Agents

Located in `backend/agents/`:

These agents automate interactions with the blockchain and IPFS. They use private keys and network configurations defined in `backend/.env`.

*   **`producer_agent.py`**:
    *   Simulates a data producer.
    *   Generates sample data (e.g., sensor readings).
    *   Uploads this data to an IPFS node, obtaining a CID.
    *   Lists the data for sale on the `DataRegistry` smart contract by calling its `listData` function with the data's metadata, CID, and price.
*   **`consumer_agent.py`**:
    *   Simulates a data consumer.
    *   Discovers available data listings by querying the `DataRegistry` contract.
    *   Selects a listing and purchases the data by calling the `purchaseData` function, sending the required ETH.
    *   Upon successful purchase, it uses the retrieved IPFS CID to fetch the actual data from an IPFS node or gateway.
*   **`config.py`**:
    *   Manages crucial configurations for the agents.
    *   Loads settings from a `.env` file (e.g., RPC URL for the Ethereum network, private keys for producer and consumer accounts, IPFS API/gateway URLs).
    *   Dynamically loads the deployed `DataRegistry` contract address and ABI from deployment artifact files (e.g., `backend/deployments/network_name.json`).
    *   Supports different network configurations (e.g., `localhost` for local Hardhat nodes, `sepolia` for the Sepolia testnet).

## Frontend Components

Located in `frontend/`:

The frontend provides a user interface for users to interact with the Auraweave data marketplace. It is currently a foundational structure that can be expanded to allow users to browse data listings, connect their Ethereum wallets (e.g., MetaMask), and initiate data purchases.

*   **Technology Stack**:
    *   **React**: A JavaScript library for building user interfaces.
    *   **Vite**: A fast build tool and development server for modern web projects.
    *   **TypeScript**: A superset of JavaScript that adds static typing.
    *   **Tailwind CSS**: A utility-first CSS framework for rapid UI development.

*   **Key Files & Directories**:
    *   `src/App.tsx`: The main component that structures the application's layout, including a navigation bar, hero section, and other content areas.
    *   `src/components/`: Contains various React components used to build the UI (e.g., `Navbar.tsx`, `Hero.tsx`, `Features.tsx`). Many of these are currently placeholders based on a template and would need to be customized or connected to the backend services to display real marketplace data.
    *   `src/main.tsx`: The entry point of the React application, responsible for rendering the `App` component into the DOM.
    *   `index.html`: The main HTML file where the React application is mounted.

The current frontend components primarily serve as a landing page template. Further development is needed to integrate Web3 functionalities for wallet connection, fetching listing data from the `DataRegistry` contract, and initiating purchase transactions.

## Getting Started

This section guides you through setting up and running the Auraweave project on your local machine.

### Prerequisites

Ensure you have the following installed:

*   **Node.js**: (v18.x or later recommended) - For running Hardhat and the frontend.
*   **npm**: (v9.x or later recommended) - Package manager for Node.js, usually comes with Node.js.
*   **Python**: (v3.8 or later recommended) - For running the backend agents.
*   **pip**: Python package installer.
*   **Hardhat**: You'll install this locally in the backend, but familiarity is helpful.
*   **An Ethereum Wallet**: (e.g., [MetaMask](https://metamask.io/)) - For interacting with the deployed application on a testnet or mainnet. Not strictly required for local-only Hardhat node testing if using provided private keys.
*   **IPFS Kubo CLI**: (v0.20.0 or later recommended, [Installation Guide](https://docs.ipfs.tech/install/command-line/#install-official-binary-distributions)) - For running a local IPFS node. Ensure it's initialized (`ipfs init`) and the API server is running (`ipfs daemon --writable`) on the default ports (API: 5001, Gateway: 8080) or configure accordingly.

### Backend Setup

1.  **Clone the Repository**:
    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Navigate to Backend Directory**:
    ```bash
    cd backend
    ```

3.  **Install Node.js Dependencies**:
    ```bash
    npm install
    ```

4.  **Install Python Dependencies**:
    It's recommended to use a virtual environment for Python projects.
    ```bash
    cd agents
    python -m venv venv
    # Activate the virtual environment
    # On Windows:
    # venv\Scripts\activate
    # On macOS/Linux:
    # source venv/bin/activate
    pip install -r requirements.txt
    cd .. 
    # You are now back in the 'backend' directory
    ```

5.  **Set Up Environment Variables**:
    *   In the `backend/` directory, create a `.env` file. You can copy `backend/.env.example` if it exists, or create it manually.
    *   Add the following variables:
        ```env
        # RPC URL for the Ethereum network
        # For local Hardhat node:
        # AURAWEAVE_NETWORK=localhost (this is the default if not set, but good to be explicit)

        # For Sepolia testnet (replace with your own RPC URL):
        # AURAWEAVE_NETWORK=sepolia
        # SEPOLIA_RPC_URL="httpss://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"

        # Private keys for the producer and consumer agents
        # These can be obtained from your Hardhat node accounts (see "Running a Local Hardhat Node" below)
        # IMPORTANT: For testnets/mainnet, use keys from a secure wallet with real funds.
        # DO NOT commit keys for public networks to Git.
        PRODUCER_PRIVATE_KEY="0x..."
        CONSUMER_PRIVATE_KEY="0x..."

        # IPFS Configuration (defaults are usually fine for local Kubo daemon)
        # IPFS_HTTP_CLIENT_URL="/ip4/127.0.0.1/tcp/5001/http"
        # IPFS_GATEWAY_URL="http://127.0.0.1:8080/ipfs/"
        ```
    *   **Note on Private Keys for Local Development**: When you run `npx hardhat node`, it will output several accounts and their private keys. You can use two of these for `PRODUCER_PRIVATE_KEY` and `CONSUMER_PRIVATE_KEY` for local testing.

6.  **Run a Local Hardhat Node (for local development)**:
    Open a new terminal in the `backend/` directory and run:
    ```bash
    npx hardhat node
    ```
    This will start a local Ethereum blockchain instance. Keep this terminal running. It will also list accounts and private keys you can use in your `.env` file.

7.  **Deploy Smart Contracts**:
    *   Ensure your IPFS daemon is running.
    *   In another terminal, navigate to the `backend/` directory.
    *   If deploying to your local Hardhat node (ensure it's running from step 6):
        ```bash
        npx hardhat run scripts/deploy.js --network localhost
        ```
    *   If deploying to a testnet (e.g., Sepolia), ensure `AURAWEAVE_NETWORK=sepolia` and `SEPOLIA_RPC_URL` are correctly set in your `.env` file:
        ```bash
        npx hardhat run scripts/deploy.js --network sepolia
        ```
    *   Successful deployment will create/update a `deployments/<network_name>.json` file (e.g., `deployments/localhost.json`). This file contains the deployed contract addresses and ABIs, which are used by the Python agents via `config.py`.

### Frontend Setup

1.  **Navigate to Frontend Directory**:
    ```bash
    cd frontend
    # (If you are in the backend/ directory, you might need to do `cd ../frontend`)
    ```

2.  **Install Node.js Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables (Frontend)**:
    The current frontend template does not require specific `.env` variables for basic operation. However, for future Web3 integration, you might need to configure variables like the `DataRegistry` contract address and the network RPC URL. This would typically be done by creating a `.env` file in the `frontend/` directory.

4.  **Run the Frontend Development Server**:
    ```bash
    npm run dev
    ```
    This will start the Vite development server, and you can access the frontend in your browser (usually at `http://localhost:5173`).

You should now have the backend (local Hardhat node and deployed contracts) and frontend running.

## How to Use / Workflow

After completing the setup, you can interact with the Auraweave components. Ensure your local Hardhat node (if using `localhost` network) and IPFS daemon are running.

### 1. Running the Producer Agent

The producer agent simulates the creation of data and lists it on the marketplace.

1.  **Ensure Configuration**:
    *   Verify your `backend/.env` file is correctly configured with `PRODUCER_PRIVATE_KEY`, `AURAWEAVE_NETWORK` (e.g., `localhost`), and IPFS URLs.
    *   The `DataRegistry` contract must be deployed to the target network, and the `backend/deployments/<network_name>.json` file must exist.

2.  **Activate Python Virtual Environment** (if not already active):
    Navigate to `backend/agents/`
    ```bash
    # On Windows:
    # ..\venv\Scripts\activate
    # On macOS/Linux:
    # source ../venv/bin/activate 
    # (If you are already in backend/agents, it's just `source venv/bin/activate`)
    ```

3.  **Run the Producer Agent Script**:
    From the `backend/agents/` directory:
    ```bash
    python producer_agent.py
    ```

4.  **Expected Output**:
    *   The agent will log its actions:
        *   Connection to Ethereum node and IPFS.
        *   Producer agent's Ethereum address and balance.
        *   Generation of dummy data.
        *   Uploading data to IPFS and receiving a CID.
        *   Transaction details for listing the data on the `DataRegistry` contract.
        *   Confirmation of the transaction.
    *   You should see events in your Hardhat node console if running locally.

### 2. Running the Consumer Agent

The consumer agent simulates discovering and purchasing data.

1.  **Ensure Configuration**:
    *   Verify your `backend/.env` file is correctly configured with `CONSUMER_PRIVATE_KEY`, `AURAWEAVE_NETWORK`, and IPFS URLs.
    *   The `DataRegistry` contract must be deployed, and listings should ideally be present (e.g., from running the producer agent).

2.  **Activate Python Virtual Environment** (if not already active and in the correct directory):
    Navigate to `backend/agents/`
    ```bash
    # On Windows:
    # ..\venv\Scripts\activate
    # On macOS/Linux:
    # source ../venv/bin/activate
    ```

3.  **Run the Consumer Agent Script**:
    From the `backend/agents/` directory:
    ```bash
    python consumer_agent.py
    ```

4.  **Expected Output**:
    *   The agent will log its actions:
        *   Connection to Ethereum node and IPFS.
        *   Consumer agent's Ethereum address and balance.
        *   Discovery of active data listings from the `DataRegistry` contract.
        *   Selection of a listing to purchase (it typically picks the first affordable one it doesn't own).
        *   Transaction details for purchasing the data.
        *   Confirmation of the purchase transaction.
        *   Attempt to fetch the purchased data from IPFS using the CID from the listing.
        *   Display of the fetched data content.
    *   You should see events in your Hardhat node console if running locally.

### 3. Interacting with the Frontend

1.  **Ensure Frontend is Running**:
    If not already started, navigate to `frontend/` and run `npm run dev`. Access it via your browser (e.g., `http://localhost:5173`).

2.  **Current Capabilities**:
    *   The current frontend is primarily a template. You can browse the static pages.
    *   **Future Development**: To make it interactive with the Auraweave backend:
        *   Implement Web3 wallet connection (e.g., using ethers.js or web3-react).
        *   Fetch and display data listings from the `DataRegistry` smart contract.
        *   Allow users to initiate purchase transactions through their connected wallets.
        *   Display user-owned data or provide download links after fetching from IPFS.

This workflow demonstrates the end-to-end process of data production, listing, discovery, purchase, and retrieval within the Auraweave ecosystem.

## Technology Stack

Auraweave is built using a combination of modern web technologies, blockchain platforms, and development tools:

*   **Blockchain & Smart Contracts**:
    *   **Solidity**: Language for writing smart contracts.
    *   **Ethereum**: The blockchain platform on which the smart contracts are deployed.
    *   **Hardhat**: Development environment for Ethereum software. Used for compiling, deploying, testing, and debugging smart contracts. Includes a local Ethereum network for development.
    *   **Hardhat Ignition**: A declarative system for deploying smart contracts, used for the `Lock.js` module.

*   **Backend Agents & Services**:
    *   **Python**: Programming language used for the producer and consumer agents.
    *   **Web3.py**: Python library for interacting with Ethereum smart contracts and nodes.
    *   **ipfshttpclient**: Python library for interacting with an IPFS node via its HTTP API.
    *   **python-dotenv**: For managing environment variables.

*   **Data Storage**:
    *   **IPFS (InterPlanetary File System)**: Distributed file system for storing and sharing data. Data CIDs are stored on the blockchain, while the actual data resides on IPFS.

*   **Frontend**:
    *   **React**: JavaScript library for building user interfaces.
    *   **Vite**: Modern frontend build tool and development server.
    *   **TypeScript**: Superset of JavaScript adding static types.
    *   **Tailwind CSS**: Utility-first CSS framework for styling.
    *   **ESLint/Prettier**: For code linting and formatting (configurations are present).

*   **General Tools**:
    *   **Node.js**: JavaScript runtime environment.
    *   **npm**: Node package manager.
    *   **Git & GitHub**: Version control and repository hosting.

## Contributing

Contributions to Auraweave are welcome! If you'd like to improve the project, please follow these general guidelines:

1.  **Fork the Repository**: Create your own fork of the project on GitHub.
2.  **Create a Branch**: Make your changes in a new git branch:
    ```bash
    git checkout -b my-feature-branch
    ```
3.  **Make Your Changes**: Implement your feature or bug fix.
    *   Ensure your code adheres to the existing style.
    *   Add or update tests if applicable.
    *   Update documentation if necessary.
4.  **Commit Your Changes**:
    ```bash
    git commit -m "Description of your feature or fix"
    ```
5.  **Push to Your Fork**:
    ```bash
    git push origin my-feature-branch
    ```
6.  **Submit a Pull Request**: Open a pull request from your feature branch to the main project repository.
    *   Clearly describe the changes you've made and why.

If you're planning a larger contribution, it's a good idea to open an issue first to discuss your ideas.
