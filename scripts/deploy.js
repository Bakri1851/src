const hre = require("hardhat");

async function main() {
  // Get the list of accounts
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the accounts:", deployer.address);


  //Loan Parameters
  const loanDaiAmount = hre.ethers.parseEther("1000");
  const feeDaiAmount = hre.ethers.parseEther("50");
  const collateralEthAmount = hre.ethers.parseEther("0.001");
  const repayByTimestamp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 30 days from now
  const fixedRate = 500;
  const floatingRate = 300;


  const SEPOLIA_DAI_ADDRESS = "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844"; // Sepolia DAI (Goerli)
  const AA_ORACLE_ADDRESS = "0xceA6Aa74E6A86a7f85B571Ce1C34f1A60B77CD29"; // Aave Borrow Rate Oracle (Goerli)

  // Get the contract factory and deploy
  const LoanRequest = await hre.ethers.getContractFactory("LoanRequest");

  // Provide any required constructor arguments to deploy()
  const loanRequest = await LoanRequest.deploy(
    loanDaiAmount,
    feeDaiAmount,
    collateralEthAmount,
    repayByTimestamp,
    fixedRate,
    floatingRate,
    SEPOLIA_DAI_ADDRESS,
    AA_ORACLE_ADDRESS
  );

  await loanRequest.waitForDeployment();
  const deployedAddress = await loanRequest.getAddress();
  console.log("LoanRequest deployed to:", deployedAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });