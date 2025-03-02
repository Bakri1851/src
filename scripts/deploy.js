const hre = require("hardhat");

async function main() {
  // Get the list of accounts
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Get the contract factory and deploy
  const LoanRequest = await hre.ethers.getContractFactory("LoanRequest");

  const AA_ORACLE_ADDRESS = "0xC3B2C33ECf2dC7586e0537058cBEf9B1CD22915e" // Aave Borrow Rate Oracle (Goerli)
  // Provide any required constructor arguments to deploy()
  const loanRequest = await LoanRequest.deploy(AA_ORACLE_ADDRESS);
  await loanRequest.deployed();

  console.log("LoanRequest deployed to:", loanRequest.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });