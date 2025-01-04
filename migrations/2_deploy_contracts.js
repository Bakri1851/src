const MockDAI = artifacts.require("MockDAI");
const LoanRequest = artifacts.require("LoanRequest");

module.exports = async function (deployer, network, accounts) {
    const [deployerAddress, lenderAddress] = accounts;


    // Deploy MockDAI
    const initialSupply = web3.utils.toWei("1000000", "ether"); // 1 million mDAI

    await deployer.deploy(MockDAI, initialSupply);

    const mockDAI = await MockDAI.deployed();


    // Transfer some MockDAI to lender
    await mockDAI.transfer(lenderAddress, web3.utils.toWei("1000", "ether"));

    // Define loan terms
    const terms = {
        loanDaiAmount: web3.utils.toWei("1000", "ether"),
        feeDaiAmount: web3.utils.toWei("50", "ether"),
        ethCollateralAmount: web3.utils.toWei("1", "ether"),
        repayByTimestamp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
        fixedRate: 500, // 5% interest
        floatingRate: 300, // 3% interest
    };
    

    // Deploy LoanRequest with MockDAI address
    await deployer.deploy(LoanRequest, terms, mockDAI.address);
};
