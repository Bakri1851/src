const { expect } = require('chai');
const { ethers } = require('hardhat');



describe("LoanRequest", function() {
    let LoanRequest, loanRequest, MockDAI, mockDAI;
    let deployer, borrower, lender;

    beforeEach(async function () {
        // Deploy MockDAI with an initial supply of 1 million mDAI
        mockDAI = await ethers.getContractFactory("MockDAI");
        mockDAI = await mockDAI.deploy(ethers.utils.parseEther("1000000"));
        await mockDAI.deployed();

        const MockAggregator = await ethers.getContractFactory("MockAggregator");
        mockAggregator = await MockAggregator.deploy(8, 2000 * 10 ** 8);
        await mockAggregator.deployed();

        // Deploy LoanRequest contract
        LoanRequest = await ethers.getContractFactory("LoanRequest");
        loanRequest = await LoanRequest.deploy(mockDAI.address);
        await loanRequest.deployed();

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
        // Fund the loan
        await mockDAI.approve(loanRequest.address, web3.utils.toWei("1000", "ether"), { from: lender });
        await loanRequest.fundLoan({ from: lender });

        // Borrower accepts the loan terms and provides collateral
        await loanRequest.takeALoanAndAcceptLoanTerms({ from: borrower, value: web3.utils.toWei("1", "ether") });

        // Calculate the repayment amount
        const interestRate = new web3.utils.BN(500); // 5% in basis points
        const loanAmount = new web3.utils.BN(web3.utils.toWei("1000", "ether"));
        const interestPaid = loanAmount.mul(interestRate).div(new web3.utils.BN(10000));
        const repaymentAmount = loanAmount.add(interestPaid);

        // Borrower approves the contract to transfer the repayment amount
        await mockDAI.approve(loanRequest.address, repaymentAmount.toString(), { from: borrower });

        console.log("loanAmount: ", loanAmount.toString());
        console.log("interestPaid: ", interestPaid.toString());
        console.log("repaymentAmount: ", repaymentAmount.toString());

        // Repay the loan
        await loanRequest.repay({ from: borrower });

        // Verify the loan state is updated to Repaid
        const state = await loanRequest.state();
        assert.equal(state.toString(), "3", "LoanState should be 'Repaid'");
        

        // Verify the lender received the repayment amount
        const lenderBalance = await mockDAI.balanceOf(lender);
        console.log("Lender Balance: ", lenderBalance.toString());
        const expectedLenderBalance = web3.utils.toWei("2050", "ether"); 
        assert.equal(lenderBalance.toString(), expectedLenderBalance.toString(), "Lender should receive the repayment amount");

        // Verify the borrower received the collateral back
        console.log("Giving back collateral to borrower");
        const borrowerCollateral = await web3.eth.getBalance(borrower);
        assert(borrowerCollateral >= web3.utils.toWei("1", "ether"), "Borrower should receive the collateral back");
        console.log("Collateral returned to borrower: ", borrowerCollateral.toString());
    });

    it("should allow lender to liquidate the loan if repayment deadline is missed", async () => {
        console.log("Funding the loan...");
        // Fund the loan
        await loanRequest.fundLoan({ from: lender });
        
        console.log("Borrower taking the loan...");
        // Borrower accepts the loan terms and provides collateral
        await loanRequest.takeALoanAndAcceptLoanTerms({ from: borrower, value: web3.utils.toWei("1", "ether") });

        console.log("Checking loan state...");
        // Check LoanRequest state
        let state = await loanRequest.state();
        assert.equal(state.toString(), "2", "LoanState should be 'Taken'");
        
        console.log("fast forwarding time...");
        // Fast forward time to after the repayment deadline

        timeInSeconds = 7 * 24 * 60 * 60 + 1; // 7 days + 1 second

        await web3.currentProvider.send({ jsonrpc: "2.0", method: "evm_increaseTime", params: [timeInSeconds], id: new Date().getTime() }, () => {});
        await web3.currentProvider.send({ jsonrpc: "2.0", method: "evm_mine", params: [], id: new Date().getTime() }, () => {});
        
                
        console.log("lender liquidating the loan...");
        // Lender liquidates the loan
        await loanRequest.liquidate({ from: lender });
        
        console.log("verifying loan state and collateral");
        // Verify the loan state is updated to Liquidated
        state = await loanRequest.state();
        console.log("Loan State: ", state.toString());
        assert.equal(state.toString(), "4", "LoanState should be 'Liquidated'");

        console.log("Verifying lender recieved collateral");
        // Verify the lender received the collateral
        const lenderCollateral = await web3.eth.getBalance(lender);
        console.log("Lender Collateral: ", lenderCollateral.toString());
        assert(lenderCollateral >= web3.utils.toWei("1", "ether"), "Lender should receive the collateral");
    });
});
