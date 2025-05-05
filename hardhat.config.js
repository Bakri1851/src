require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
    viaIR: true,
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    showTimeSpent: true,
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [
        `0x${process.env.PRIVATE_KEY_LENDER}`,
        `0x${process.env.PRIVATE_KEY_BORROWER}`,
      ],
    },
    sourcify: {
      url: "https://sourcify.dev/api",
      enabled: true,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // Store API key in .env
  },
  mocha: {
    timeout: 20000,
  },

  paths: {
    sources: "./loan-backend/contracts",
    artfacts: "./artifacts",
  },
};
