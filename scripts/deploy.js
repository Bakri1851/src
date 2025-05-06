const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the accounts:", deployer.address);

  // Determine oracle address based on network (deploy mock if local)
  let oracleAddress;
  const networkName = hre.network.name;
  const sepoliaOracleAddress = "0x8e604308BD61d975bc6aE7903747785Db7dE97e2";

  if (networkName === "localhost" || networkName === "hardhat") {
    console.log("Deploying MockV3Aggregator for local network...");
    const initialPrice = 3000 * 10 ** 8; // Example: 3000 USD with 8 decimals
    const MockV3Aggregator = await hre.ethers.getContractFactory(
      "MockV3Aggregator"
    );
    const mockOracle = await MockV3Aggregator.deploy(initialPrice);
    await mockOracle.waitForDeployment();
    oracleAddress = await mockOracle.getAddress();
    console.log("MockV3Aggregator deployed to:", oracleAddress);
  } else if (networkName === "sepolia") {
    console.log("Using Sepolia Oracle Address:", sepoliaOracleAddress);
    oracleAddress = sepoliaOracleAddress;
  } else {
    throw new Error(
      `Unsupported network: ${networkName}. Add oracle address or mock deployment.`
    );
  }

  // Deploy LoanFactory using the determined oracleAddress
  console.log("Deploying LoanFactory with oracle:", oracleAddress);
  const LoanFactory = await hre.ethers.getContractFactory("LoanFactory");
  const loanFactory = await LoanFactory.deploy(oracleAddress); // Ensure constructor accepts address
  await loanFactory.waitForDeployment();
  const loanFactoryAddress = await loanFactory.getAddress();
  console.log("LoanFactory deployed to:", loanFactoryAddress);

  // --- Deploy other contracts if needed ---

  console.log("Deployment complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
