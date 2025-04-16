const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the accounts:", deployer.address);

  const AA_ORACLE_ADDRESS = "0xceA6Aa74E6A86a7f85B571Ce1C34f1A60B77CD29";
  const oracle = await hre.ethers.getContractAt("AggregatorV3Interface", AA_ORACLE_ADDRESS);
  const latestRoundData = await oracle.latestRoundData();
  console.log("Latest round data:", latestRoundData.answer.toString());
  const marketFloatingRate = Number(latestRoundData[1]);

  const loanAmount = hre.ethers.parseEther("0.002");
  const feeAmount = hre.ethers.parseEther("0.0005");
  const collateralEthAmount = hre.ethers.parseEther("0.001");
  const repayByTimestamp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const floatingRate = Math.floor(Number(marketFloatingRate)*100/1e6); 
  const spread = 1;
  const fixedRate = floatingRate + spread;

  // Get the factory contract
  const factoryAddress = "0x8eb9D46f76d1273ce3D385Ab99e4123F72BaDfEa";
  const loanFactory = await hre.ethers.getContractAt("LoanFactory", factoryAddress);
  
  console.log("Creating loan through factory...");
  const tx = await loanFactory.createLoan(
    loanAmount,
    feeAmount,
    collateralEthAmount,
    repayByTimestamp,
    fixedRate,
    floatingRate,
    AA_ORACLE_ADDRESS
  );

  console.log("Transaction sent:", tx.hash);
  console.log("Waiting for transaction to be mined...");
  
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);

  // Find the LoanCreated event - proper handling for ethers v6
  let loanAddress;

  if (receipt.logs) {
    // Look through the logs to find the LoanCreated event
    const loanFactoryInterface = loanFactory.interface;
    
    for (const log of receipt.logs) {
      try {
        // Try to parse each log
        const parsedLog = loanFactoryInterface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === "LoanCreated") {
          loanAddress = parsedLog.args[2]; // loanContract is the 3rd argument (index 2)
          console.log("Loan created at:", loanAddress);
          break;
        }
      } catch (e) {
        // Skip logs that can't be parsed
      }
    }
  }

  if (!loanAddress) {
    // Fallback: query the factory for the latest loan
    console.log("Could not find loan address in logs, checking getAllLoans...");
    const allLoans = await loanFactory.getAllLoans();
    if (allLoans.length > 0) {
      loanAddress = allLoans[allLoans.length - 1];
      console.log("Latest loan from getAllLoans:", loanAddress);
    } else {
      console.log("No loans found in factory.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });