require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();
require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    goerli: {
      url: "https://goerli.infura.io/v3/your-infura-project-id",// Replace with your Infura Project ID
      accounts: [`0x${process.env.PRIVATE_KEY}`]  // Replace with your private key
    },
  },
  mocha: {
    timeout: 20000
  }
};
