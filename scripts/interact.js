const hre = require("hardhat");

async function main() {
  // Get the list of accounts
  const [lender,borrower] = await hre.ethers.getSigners();


  //CHANGE WHEN TESTING
  const contractAddress = "0x40d3345B2749c95d514523331c741fFC09117B95";

  const LoanRequest = await hre.ethers.getContractFactory("LoanRequest");
  const loanRequest = await LoanRequest.attach(contractAddress);

  const lenderTx = await loanRequest.connect(lender).fundLoan();
  await lenderTx.wait();
  console.log("Lender funded the loan");


  const collateralAmount = await hre.ethers.utils.parseEthers("0.001");
  const borrowerTx = await loanRequest.connect(borrower).takeALoanAndAcceptLoanTerms({value: collateralAmount}); 
  await borrowerTx.wait();
  console.log("borrower took the loan and accepted the loan terms");
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });