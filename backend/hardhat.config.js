
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); 

module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "", 
      accounts:
        process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
     
    },
  },
  etherscan: { 
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};