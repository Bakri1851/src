require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    goerli: {
      provider: () =>
        new HDWalletProvider(
          process.env.PRIVATE_KEY, // Use private key instead of mnemonic
          `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}` // Infura URL
        ),
      network_id: 5, // Goerli network ID
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },
  compilers: {
    solc: {
      version: "0.8.13",
    },
  },
};


