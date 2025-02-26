async function main() {
  // Get the list of accounts
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Get the contract factory and deploy
  const LoanRequest = await ethers.getContractFactory("LoanRequest");
  // Provide any required constructor arguments to deploy()
  const loanRequest = await LoanRequest.deploy(/* constructor arguments */);

  console.log("LoanRequest deployed to:", loanRequest.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });