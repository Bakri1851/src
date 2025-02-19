const MockDAI = artifacts.require("MockDAI");
const LoanRequest = artifacts.require("LoanRequest");

module.exports = async function (deployer, network, accounts) {
    const [deployerAddress, lenderAddress] = accounts;

    // Deploy MockDAI with an initial supply of 1 million mDAI
    const initialSupply = web3.utils.toWei("1000000", "ether"); // 1 million mDAI
    await deployer.deploy(MockDAI, initialSupply);
    const mockDAI = await MockDAI.deployed();

    // Transfer some MockDAI to lender
    await mockDAI.transfer(lenderAddress, web3.utils.toWei("1000", "ether"));

    // Define loan terms
    const terms = {
        loanDaiAmount: web3.utils.toWei("1000", "ether"), // Loan amount in DAI
        feeDaiAmount: web3.utils.toWei("50", "ether"), // Fee amount in DAI
        ethCollateralAmount: web3.utils.toWei("1", "ether"), // Collateral amount in ETH
        repayByTimestamp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // Repayment deadline (7 days from now)
        fixedRate: 500, // Fixed interest rate (5% in basis points)
        floatingRate: 300, // Floating interest rate (3% in basis points)
    };

    // Deploy LoanRequest contract with the defined terms and MockDAI address
    await deployer.deploy(LoanRequest, terms.loanDaiAmount, terms.feeDaiAmount, terms.ethCollateralAmount, terms.repayByTimestamp, terms.fixedRate, terms.floatingRate, mockDAI.address);
};
