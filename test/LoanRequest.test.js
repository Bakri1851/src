const LoanRequest = artifacts.require("LoanRequest");
const MockDAI = artifacts.require("MockDAI");

contract("LoanRequest", (accounts) => {
    const [deployer, lender, borrower] = accounts;
    let mockDAI, loanRequest;

    beforeEach(async () => {
        // Deploy MockDAI
        mockDAI = await MockDAI.new(web3.utils.toWei("1000000", "ether"), { from: deployer });

        // Transfer MockDAI to lender and borrower
        await mockDAI.transfer(lender, web3.utils.toWei("1000", "ether"), { from: deployer });
        await mockDAI.transfer(borrower, web3.utils.toWei("1100", "ether"), { from: deployer });


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
      
      // Lender approves and funds the loan
      await mockDAI.approve(loanRequest.address, web3.utils.toWei("1000", "ether"), { from: lender });
      await loanRequest.fundLoan({ from: lender });

      // Borrower accepts the loan terms and provides collateral
      await loanRequest.takeALoanAndAcceptLoanTerms({ from: borrower, value: web3.utils.toWei("1", "ether") });

      // Calculate the repayment amount
      const interestRate = 500; // 5% in basis points
      const loanAmount = web3.utils.toWei("1000", "ether");
      const interestPaid = (loanAmount * interestRate) / 10000;
      const repaymentAmount = loanAmount + interestPaid;

      // Borrower approves the contract to transfer the repayment amount
      await mockDAI.approve(loanRequest.address, repaymentAmount.toString(), { from: borrower });

      // Borrower repays the loan
      await loanRequest.repay({ from: borrower });

      // Verify the loan state is updated to Repaid
      const state = await loanRequest.state();
      assert.equal(state.toString(), "3", "LoanState should be 'Repaid'");

      // Verify the lender received the repayment amount
      const lenderBalance = await mockDAI.balanceOf(lender);

      console.log("Lender Balance: ", lenderBalance.toString());
      assert.equal(lenderBalance.toString(), repaymentAmount.toString(), "Lender should receive the repayment amount");

      // Verify the borrower received the collateral back
      const borrowerCollateral = await web3.eth.getBalance(borrower);
      assert(borrowerCollateral >= web3.utils.toWei("1", "ether"), "Borrower should receive the collateral back");
  });
});
