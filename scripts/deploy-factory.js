const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the accounts:", deployer.address);

    const loanFactory = await hre.ethers.getContractFactory("LoanFactory");
    const loanFactoryContract = await loanFactory.deploy();

    await loanFactoryContract.waitForDeployment();
    const factoryAddress = await loanFactoryContract.getAddress();

    console.log("LoanFactory deployed to:", factoryAddress);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });