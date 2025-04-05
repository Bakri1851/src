const hre = require("hardhat");

async function main() {
  // Get the list of accounts
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the accounts:", deployer.address);

  const AA_ORACLE_ADDRESS = "0xceA6Aa74E6A86a7f85B571Ce1C34f1A60B77CD29"; // Aave Borrow Rate Oracle (Goerli)
  const oracle = await hre.ethers.getContractAt("AggregatorV3Interface", AA_ORACLE_ADDRESS);
  const latestRoundData = await oracle.latestRoundData();
  const marketFloatingRate = Number(latestRoundData[1]); // int256 => JS number



  //Loan Parameters
  const loanAmount = hre.ethers.parseEther("0.002");
  const feeAmount = hre.ethers.parseEther("0.0005");
  const collateralEthAmount = hre.ethers.parseEther("0.001");
  const repayByTimestamp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 30 days from now
  const floatingRate = marketFloatingRate; 
  const spread = 100; // 1% spread
  const fixedRate = floatingRate + spread; // 1% higher than the floating ratw



  // Get the contract factory and deploy
  const LoanRequest = await hre.ethers.getContractFactory("LoanRequest");

  // Provide any required constructor arguments to deploy()
  const loanRequest = await LoanRequest.deploy(
    loanAmount,
    feeAmount,
    collateralEthAmount,
    repayByTimestamp,
    fixedRate,
    floatingRate,
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