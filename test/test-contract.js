const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("LoanRequest Contract", function () {
  // Fixture to deploy the contracts before each test
  async function deployLoanRequestFixture() {
    // Get signers
    const [owner, borrower, lender] = await ethers.getSigners();

    // Deploy the factory contract first
    const LoanFactory = await ethers.getContractFactory("LoanFactory");
    const loanFactory = await LoanFactory.deploy();

    // Get the factory address
    const factoryAddress = await loanFactory.getAddress();

    // Parameters for loan
    const loanAmount = ethers.parseEther("1");
    const feeAmount = ethers.parseEther("0.05");
    const collateralAmount = ethers.parseEther("1.5");
    const now = Math.floor(Date.now() / 1000);
    const repayByTimestamp = now + 86400; // 1 day from now
    const fixedRate = 1000; // 10%
    const floatingRate = 800; // 8%
    const oracle = "0x8e604308BD61d975bc6aE7903747785Db7dE97e2"; // Oracle address
    const interestCalculationType = 0; // SimpleAPR

    // Create proposal through the factory
    await loanFactory
      .connect(borrower)
      .createProposal(
        loanAmount,
        feeAmount,
        collateralAmount,
        repayByTimestamp,
        fixedRate,
        floatingRate,
        oracle,
        interestCalculationType
      );

    // Accept the proposal as lender to create a loan contract
    await loanFactory.connect(lender).acceptProposal(0, {
      value: loanAmount,
    });

    // Get the deployed loan contract address
    const loanAddress = await loanFactory.proposalToAddress(0);

    // Get a contract instance for the loan
    const LoanRequest = await ethers.getContractFactory("LoanRequest");
    const loanRequest = LoanRequest.attach(loanAddress);

    return {
      loanRequest,
      loanFactory,
      borrower,
      lender,
      loanAmount,
      feeAmount,
      collateralAmount,
      repayByTimestamp,
      fixedRate,
      floatingRate,
    };
  }

  describe("Loan Creation", function () {
    it("Should initialise loan with correct parameters", async function () {
      const {
        loanRequest,
        loanAmount,
        feeAmount,
        collateralAmount,
        repayByTimestamp,
      } = await loadFixture(deployLoanRequestFixture);

      // Check state is initially Funded
      const state = await loanRequest.state();
      expect(state).to.equal(1); // LoanState.Funded

      // Check loan parameters (borrower not set until acceptLoanTerms is called)
      expect(await loanRequest.getLoanAmount()).to.equal(loanAmount);
      expect(await loanRequest.getFeeAmount()).to.equal(feeAmount);
      expect(await loanRequest.getEthCollateralAmount()).to.equal(
        collateralAmount
      );
      expect(await loanRequest.getRepayByTimestamp()).to.equal(
        repayByTimestamp
      );

      // Check initial interest rate type
      const rateType = await loanRequest.currentRateType();
      expect(rateType).to.equal(0); // Fixed rate by default
    });
  });

  describe("Loan Lifecycle", function () {
    it("Should allow borrower to accept terms and take loan", async function () {
      const { loanRequest, borrower, collateralAmount } = await loadFixture(
        deployLoanRequestFixture
      );

      // Accept loan terms by borrower (requires collateral)
      await expect(
        loanRequest.connect(borrower).acceptLoanTerms({
          value: collateralAmount,
        })
      ).to.emit(loanRequest, "LoanTermsAccepted");

      // Check state updated to Accepted
      expect(await loanRequest.state()).to.equal(2); // LoanState.Accepted

      // Take loan
      await expect(loanRequest.connect(borrower).takeLoan()).to.emit(
        loanRequest,
        "LoanTaken"
      );

      // Check state updated to Taken
      expect(await loanRequest.state()).to.equal(3); // LoanState.Taken
    });

    it("Should not allow accepting terms with insufficient collateral", async function () {
      const { loanRequest, borrower } = await loadFixture(
        deployLoanRequestFixture
      );

      // Try to accept loan terms with insufficient collateral
      const insufficientCollateral = ethers.parseEther("0.5"); // Less than required
      await expect(
        loanRequest.connect(borrower).acceptLoanTerms({
          value: insufficientCollateral,
        })
      ).to.be.revertedWith("Incorrect collateral amount");
    });
  });

  describe("Interest Rate Management", function () {
    it("Should allow borrower to switch rate types", async function () {
      const { loanRequest, borrower, collateralAmount } = await loadFixture(
        deployLoanRequestFixture
      );

      // First accept and take the loan
      await loanRequest.connect(borrower).acceptLoanTerms({
        value: collateralAmount,
      });
      await loanRequest.connect(borrower).takeLoan();

      // Check initial rate type
      expect(await loanRequest.currentRateType()).to.equal(0); // Fixed rate

      // Switch rate type
      await loanRequest.connect(borrower).switchRateType();

      // Check rate type changed
      expect(await loanRequest.currentRateType()).to.equal(1); // Floating rate

      // Switch back
      await loanRequest.connect(borrower).switchRateType();

      // Check rate type changed back
      expect(await loanRequest.currentRateType()).to.equal(0); // Fixed rate again
    });

    it("Should not allow non-borrower to switch rates", async function () {
      const { loanRequest, borrower, lender, collateralAmount } =
        await loadFixture(deployLoanRequestFixture);

      // First accept and take the loan
      await loanRequest.connect(borrower).acceptLoanTerms({
        value: collateralAmount,
      });
      await loanRequest.connect(borrower).takeLoan();

      // Try to switch rate as lender (not borrower)
      await expect(
        loanRequest.connect(lender).switchRateType()
      ).to.be.revertedWith("Only borrower can switch rate type");
    });
  });

  describe("Interest Calculation", function () {});

  describe("Loan Liquidation", function () {
    it("Should not allow liquidation before deadline", async function () {
      const { loanRequest, lender, borrower, collateralAmount } =
        await loadFixture(deployLoanRequestFixture);

      // First accept and take the loan
      await loanRequest.connect(borrower).acceptLoanTerms({
        value: collateralAmount,
      });
      await loanRequest.connect(borrower).takeLoan();

      // Try to liquidate before deadline
      await expect(loanRequest.connect(lender).liquidate()).to.be.revertedWith(
        "Repayment deadline has not passed"
      );
    });

    it("Should not allow non-lender to liquidate", async function () {
      const { loanRequest, borrower, collateralAmount, repayByTimestamp } =
        await loadFixture(deployLoanRequestFixture);

      // First accept and take the loan
      await loanRequest.connect(borrower).acceptLoanTerms({
        value: collateralAmount,
      });
      await loanRequest.connect(borrower).takeLoan();

      // Fast forward time beyond repayment deadline
      await time.increaseTo(repayByTimestamp + 1);

      // Try to liquidate as borrower (not lender)
      await expect(
        loanRequest.connect(borrower).liquidate()
      ).to.be.revertedWith("Only lender can liquidate the loan");
    });
  });
});
