const LoanRequest = artifacts.require("LoanRequest");

module.exports = async function (deployer, network) {
    let oracleAddress;

    if (network === "goerli") {
        oracleAddress = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";  // Chainlink ETH/USD Price Feed (Goerli)
    } else if (network === "mainnet") {
        oracleAddress = "0x77f973FCaF871459aa58cd81881Ce453759281bC";  // Aave Borrow Rate Oracle (Mainnet)
    } else {
        throw new Error("Oracle address not set for this network!");
    }

    await deployer.deploy(LoanRequest, oracleAddress);
};
