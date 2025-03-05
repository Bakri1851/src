require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    sourcify: {
      url: "https://sourcify.dev/server",
      enabled: true,
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY // Store API key in .env
  },  
  mocha: {
    timeout: 20000
  }
};
