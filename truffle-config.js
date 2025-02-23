module.exports = {
  networks: {
    goerli: {
      provider: () => new HDWalletProvider(mnemonic, `https://goerli.infura.io/v3/${infuraKey}`),
      network_id: 5,       // Goerli's id
      gas: 5500000,        // Goerli has a lower block limit than mainnet
    }
  },
  compilers: {
    solc: {
      version: "0.8.13", // Specify the Solidity version you are using
    },
  },
};

