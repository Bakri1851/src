const LoanRequest = artifacts.require("LoanRequest");
const MockDAI = artifacts.require("MockDAI");

contract("LoanRequest", (accounts) => {
    const [deployer, lender, borrower] = accounts;
    let mockDAI, loanRequest;

    beforeEach(async () => {
        // Deploy MockDAI
        mockDAI = await MockDAI.new(web3.utils.toWei("1000000", "ether"), { from: deployer });

        // Transfer MockDAI to lender
        await mockDAI.transfer(lender, web3.utils.toWei("1000", "ether"), { from: deployer });

        // Define loan terms
        const terms = {
            loanDaiAmount: web3.utils.toWei("1000", "ether"),
            feeDaiAmount: web3.utils.toWei("50", "ether"),
            ethCollateralAmount: web3.utils.toWei("1", "ether"),
            repayByTimestamp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
            fixedRate: 500,
            floatingRate: 300,
        };

        // Deploy LoanRequest
        loanRequest = await LoanRequest.new(terms, mockDAI.address, { from: deployer });
        await mockDAI.approve(loanRequest.address, web3.utils.toWei("1000", "ether"), { from: borrower });
      });

    it("should fund the loan", async () => {
        // Approve LoanRequest contract to transfer MockDAI
        await mockDAI.approve(loanRequest.address, web3.utils.toWei("1000", "ether"), { from: lender });

        // Fund the loan
        await loanRequest.fundLoan({ from: lender });

        // Check LoanRequest state
        const state = await loanRequest.state();
        assert.equal(state.toString(), "1", "LoanState should be 'Funded'");
    });

    it("should allow borrower to take the loan", async () => {
        // Fund the loan
        await mockDAI.approve(loanRequest.address, web3.utils.toWei("1000", "ether"), { from: lender });
        await loanRequest.fundLoan({ from: lender });

        // Take the loan
        await loanRequest.takeALoanAndAcceptLoanTerms({ from: borrower, value: web3.utils.toWei("1", "ether") });

        // Check LoanRequest state
        const state = await loanRequest.state();
        assert.equal(state.toString(), "2", "LoanState should be 'Taken'");
    });

    it("should allow borrower to repay the loan", async () => {
        // Fund and take the loan
        await mockDAI.approve(loanRequest.address, web3.utils.toWei("1000", "ether"), { from: lender });
        await loanRequest.fundLoan({ from: lender });
        await loanRequest.takeALoanAndAcceptLoanTerms({ from: borrower, value: web3.utils.toWei("1050", "ether") });

        // Transfer DAI tokens to borrower to cover repayment
        const borrowerBalance = await mockDAI.balanceOf(borrower);
        console.log("Borrower DAI Balance:", web3.utils.fromWei(borrowerBalance.toString(), "ether"));

        const allowance = await mockDAI.allowance(borrower, loanRequest.address);
        console.log("Allowance for LoanRequest:", web3.utils.fromWei(allowance.toString(), "ether"));


        const repaymentAmount = web3.utils.toWei("1", "ether"); // 1000 DAI + 5% interest
        console.log("Amount to Repay:", repaymentAmount);

        await mockDAI.transfer(borrower, repaymentAmount, { from: lender });

        // Approve repayment
        await mockDAI.approve(loanRequest.address, repaymentAmount, { from: borrower });

        // Repay the loan
        // here is where the problem is 
        await loanRequest.repay({ from: borrower });

        // Check LoanRequest state
        const state = await loanRequest.state();
        assert.equal(state.toString(), "3", "LoanState should be 'Repaid'");

    });
});
