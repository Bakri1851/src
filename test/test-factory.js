const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// This test suite is for the LoanFactory contract, which manages loan proposals and liquidity.
describe("LoanFactory Contract", function () {
  async function deployLoanFactoryFixture() {
    const [owner, borrower, lender] = await ethers.getSigners();

    const LoanFactory = await ethers.getContractFactory("LoanFactory");
    const loanFactory = await LoanFactory.deploy();

    return { loanFactory, owner, borrower, lender };
  }

  describe("Proposal Creation", function () {
    it("Should create a loan proposal correctly", async function () {
      const { loanFactory, borrower } = await loadFixture(
        deployLoanFactoryFixture
      );

      const loanAmount = ethers.parseEther("1");
      const feeAmount = ethers.parseEther("0.05");
      const collateralAmount = ethers.parseEther("1.5");
      const now = Math.floor(Date.now() / 1000);
      const repayByTimestamp = now + 86400; // 1 day from now
      const fixedRate = 1000; // 10%
      const floatingRate = 800; // 8%
      const oracle = "0x8e604308BD61d975bc6aE7903747785Db7dE97e2"; // Oracle address
      const interestCalculationType = 0; // SimpleAPR

      await expect(
        loanFactory
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
          )
      ).to.emit(loanFactory, "LoanProposalCreated");

      const proposal = await loanFactory.getProposal(0);
      expect(proposal.borrower).to.equal(borrower.address);
      expect(proposal.loanAmount).to.equal(loanAmount);
      expect(proposal.feeAmount).to.equal(feeAmount);
      expect(proposal.ethCollateralAmount).to.equal(collateralAmount);
      expect(proposal.repayByTimestamp).to.equal(repayByTimestamp);
      expect(proposal.fixedRate).to.equal(fixedRate);
      expect(proposal.floatingRate).to.equal(floatingRate);
      expect(proposal.oracle).to.equal(oracle);
      expect(proposal.accepted).to.equal(false);
      expect(proposal.interestCalculationType).to.equal(
        interestCalculationType
      );
    });

    it("Should retrieve all open proposals correctly", async function () {
      const { loanFactory, borrower } = await loadFixture(
        deployLoanFactoryFixture
      );

      const loanAmount = ethers.parseEther("1");
      const feeAmount = ethers.parseEther("0.05");
      const collateralAmount = ethers.parseEther("1.5");
      const now = Math.floor(Date.now() / 1000);
      const repayByTimestamp = now + 86400; // 1 day from now
      const fixedRate = 1000; // 10%
      const floatingRate = 800; // 8%
      const oracle = "0x8e604308BD61d975bc6aE7903747785Db7dE97e2"; // Oracle address
      const interestCalculationType = 0; // SimpleAPR

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

      const proposals = await loanFactory.getAllOpenProposals();
      expect(proposals.length).to.equal(2);
    });
  });

  describe("Liquidity Management", function () {
    it("Should add liquidity correctly", async function () {
      const { loanFactory, lender } = await loadFixture(
        deployLoanFactoryFixture
      );

      const liquidityAmount = ethers.parseEther("5");
      const initialLiquidity = await loanFactory.totalLiquidity();

      await loanFactory.connect(lender).addLiquidity({
        value: liquidityAmount,
      });

      const newLiquidity = await loanFactory.totalLiquidity();
      expect(newLiquidity).to.equal(initialLiquidity + liquidityAmount);
    });

    it("Should remove liquidity correctly", async function () {
      const { loanFactory, lender } = await loadFixture(
        deployLoanFactoryFixture
      );

      const liquidityAmount = ethers.parseEther("5");
      await loanFactory.connect(lender).addLiquidity({
        value: liquidityAmount,
      });

      const initialLiquidity = await loanFactory.totalLiquidity();
      const withdrawAmount = ethers.parseEther("2");

      await loanFactory.connect(lender).removeLiquidity(withdrawAmount);

      const newLiquidity = await loanFactory.totalLiquidity();
      expect(newLiquidity).to.equal(initialLiquidity - withdrawAmount);
    });
  });

  describe("Utilization Rate", function () {
    it("Should calculate utilization rate correctly", async function () {
      const { loanFactory } = await loadFixture(deployLoanFactoryFixture);

      const initialUtilization = await loanFactory.getUtilizationRate();

      expect(initialUtilization).to.equal(4500);

      await loanFactory.updateUtilizationMetrics(ethers.parseEther("50"), true);

      const newUtilization = await loanFactory.getUtilizationRate();
      expect(newUtilization).to.equal(5000);
    });
  });
});
