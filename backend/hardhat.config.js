// auraweave-mvp/hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // To load .env variables for potential future use (like Sepolia)

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28", // Ensure this matches your contract's pragma
  defaultNetwork: "hardhat", // Makes `npx hardhat run` default to the in-memory hardhat network
  networks: {
    hardhat: { // Used by `npx hardhat node` and for in-memory testing
      chainId: 1337, // Standard for local Hardhat network
    },
    localhost: { // For connecting to a separate `npx hardhat node` instance
      url: "http://127.0.0.1:8545",
      chainId: 1337, // Must match the chainId of the `npx hardhat node`
      // No 'accounts' needed here, `npx hardhat node` provides them.
      // If you want a specific deployer from .env for localhost:
      // accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    // Sepolia configuration (for future use, keep it commented or remove if not needed now)
    /*
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts:
        process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    */
  },
  // Optional: for etherscan verification (not needed for local)
  /*
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  */
};