module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 7545,        // Ganache GUI or CLI port
      network_id: "*",   // Match any network id
      gas: 6000000,
    },
  },
  compilers: {
    solc: {
      version: "0.8.13", // Specify the Solidity version you are using
    },
  },
};
