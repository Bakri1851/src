// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "hardhat/console.sol";
import {AggregatorV3Interface} from "./AggregatorV3Interface.sol";


contract LoanRequest {
    enum LoanState { Created, Funded, Accepted, Taken, Repaid, Liquidated }
    enum InterestRateType { Fixed, Floating }

    LoanState public state;
    InterestRateType public currentRateType;

    AggregatorV3Interface internal oracle;

    struct Terms {
        uint256 loanAmount;
        uint256 feeAmount;
        uint256 ethCollateralAmount;
        uint256 repayByTimestamp;
        uint256 fixedRate;
        uint256 floatingRate;
    }

    Terms public terms;

    address payable public lender;
    address payable public borrower;
    uint256 public loanAmount;
    uint256 public feeAmount;
    uint256 public ethCollateralAmount;
    uint256 public repayByTimestamp;
    uint256 public fixedRate; // in basis points
    uint256 public floatingRate; // in basis points

    constructor(
        uint256 _loanAmount,
        uint256 _feeAmount,
        uint256 _ethCollateralAmount,
        uint256 _repayByTimestamp,
        uint256 _fixedRate,
        uint256 _floatingRate,
        address _oracle
    ) {
        loanAmount = _loanAmount;
        feeAmount = _feeAmount;
        ethCollateralAmount= _ethCollateralAmount;
        repayByTimestamp= _repayByTimestamp;
        fixedRate= _fixedRate;
        floatingRate= _floatingRate;

        oracle = AggregatorV3Interface(_oracle);
        state = LoanState.Created;
        currentRateType = InterestRateType.Fixed; // Default to fixed rate
        lender = payable(msg.sender);
    }
    // Lender funds the loan
    function fundLoan() external payable{
        require(state == LoanState.Created, "Loan is not in Created state");
        require(msg.sender == lender, "Only lender can fund the loan");
        require(msg.value == loanAmount, "Incorrect loan amount");

        lender = payable(msg.sender);     
        state = LoanState.Funded;

        emit LoanFunded(msg.sender, loanAmount);
    }


    // Borrower accepts the loan terms
    function acceptLoanTerms() external payable {
        require(state == LoanState.Funded, "Loan is not in Funded state");
        require(msg.sender != lender, "Lender cannot take the loan");
        require(msg.value == ethCollateralAmount, "Incorrect collateral amount");
        borrower = payable(msg.sender);
        state = LoanState.Accepted;
        emit LoanTermsAccepted(msg.sender, ethCollateralAmount);
    }

    // Borrower takes the loan
    function takeLoan() external payable {
        require(state == LoanState.Accepted, "Loan is not in accepted state");
        require(msg.sender == borrower, "Only borrower can take the loan");

        state = LoanState.Taken;
        borrower.transfer(loanAmount);
        emit LoanTaken(msg.sender, loanAmount);

    }

    // Borrower repays the loan
    function repay() external payable {
        require(state == LoanState.Taken, "Loan is not in Taken state");
        require(msg.sender == borrower, "Only borrower can repay the loan");

        uint256 repaymentAmount = loanAmount + calculateInterest();

        require(msg.value == repaymentAmount, "Incorrect repayment amount");
        state = LoanState.Repaid;
        lender.transfer(repaymentAmount);
        borrower.transfer(ethCollateralAmount);

        emit LoanRepaid(msg.sender, repaymentAmount);
    }
    // Lender liquidates the loan when loan isnt repaid by deadline
    function liquidate() external {
        require(state == LoanState.Taken, "Loan is not in Taken state");
        require(block.timestamp > repayByTimestamp, "Repayment deadline has not passed");
        require(msg.sender == lender, "Only lender can liquidate the loan");

        state = LoanState.Liquidated;
        lender.transfer(ethCollateralAmount);
        emit LoanLiquidated(borrower, lender, ethCollateralAmount);

    }

    function updateRates() public {
        // Update floating rate using oracle
        (, int price, , ,) = oracle.latestRoundData();
        uint256 newFloatingRate = uint256(price)*100 / 1e6; // Adjust based on the oracle's decimal places
        floatingRate = newFloatingRate;
        uint256 spread = 1;
        fixedRate = floatingRate + spread;
    }
    function getFixedRate() public view returns (uint256){
        return fixedRate;
    }

    function getFloatingRate() public view returns (uint256){
        return floatingRate;
    }

    function switchRateType() public {
        if (currentRateType == InterestRateType.Fixed) {
            currentRateType = InterestRateType.Floating;
        } else {
            currentRateType = InterestRateType.Fixed;
        }
    }

    function calculateInterest() public view returns (uint256) {
        uint256 interestAmount = (currentRateType == InterestRateType.Fixed) ? fixedRate : floatingRate;
        uint256 timeElapsed = block.timestamp - terms.repayByTimestamp;

        uint256 interest = (terms.loanAmount * interestAmount * timeElapsed) / (100*355 days);

        return interest;

        // switch to use oracle for floating rate

    }

    function getLoanState() public view returns (LoanState) {
        return state;
        
    }

    function getLoanAmount() public view returns (uint256) {
        return loanAmount;
    }
    function getFeeAmount() public view returns (uint256) {
        return feeAmount;
    }
    function getEthCollateralAmount() public view returns (uint256) {
        return ethCollateralAmount;
    }

    function getRepayByTimestamp() public view returns (uint256) {
        return repayByTimestamp;
    }
    event LoanFunded(address indexed lender, uint256 loanAmount);
    event LoanTermsAccepted(address indexed borrower, uint256 collateralAmount);
    event LoanTaken(address indexed borrower, uint256 loanAmount);
    event LoanRepaid(address indexed borrower, uint256 repaymentAmount);
    event LoanLiquidated(address indexed borrower, address indexed lender, uint256 collateralAmount);
}
