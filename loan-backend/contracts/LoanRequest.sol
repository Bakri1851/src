// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "hardhat/console.sol";
import {AggregatorV3Interface} from "./AggregatorV3Interface.sol";
import "./LoanFactory.sol";

contract LoanRequest {
    enum LoanState { Created, Funded, Accepted, Taken, Repaid, Liquidated }
    enum InterestRateType { Fixed, Floating }
    enum InterestCalculationType {SimpleAPR, CompoundAPY}
    InterestCalculationType public interestCalculationType;

    LoanState public state;
    uint256 public interest; 
    InterestRateType public currentRateType;
    address public factory;
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
    uint256 public loanTakenTimestamp;
    uint256 public creationTimestamp;


    constructor(
        uint256 _loanAmount,
        uint256 _feeAmount,
        uint256 _ethCollateralAmount,
        uint256 _repayByTimestamp,
        uint256 _fixedRate,
        uint256 _floatingRate,
        address _oracle,
        address _loanFactory,
        address _lender,
        uint256 _creationTimestamp,
        uint8 _interestCalculationType

    ) {
        loanAmount = _loanAmount;
        feeAmount = _feeAmount;
        ethCollateralAmount = _ethCollateralAmount;
        repayByTimestamp = _repayByTimestamp;
        fixedRate = _fixedRate;
        floatingRate = _floatingRate;
        creationTimestamp = _creationTimestamp;

        oracle = AggregatorV3Interface(_oracle);
        factory = _loanFactory;
        state = LoanState.Created;
        currentRateType = InterestRateType.Fixed;
        lender = payable(_lender);  // Set lender to the provided address

        interestCalculationType = InterestCalculationType(_interestCalculationType);
    }
    // Lender funds the loan
    function fundLoan() external payable{
        require(state == LoanState.Created, "Loan is not in Created state");
        require(msg.sender == lender || msg.sender == factory  , "Only lender can fund the loan");
        require(msg.value == loanAmount, "Incorrect loan amount");

        if (msg.sender != factory) {
            lender = payable(msg.sender); // Only update lender if direct funding (not from factory)
        }        
        
        state = LoanState.Funded;

        emit LoanFunded(msg.sender, loanAmount);
    }


    // Borrower accepts the loan terms
    function acceptLoanTerms() external payable {
        require(state == LoanState.Funded, "Loan is not in Funded state");
        require(msg.sender != lender, "Lender cannot take the loan");
        require(msg.value == ethCollateralAmount, "Incorrect collateral amount");
        borrower = payable(msg.sender);
        LoanFactory(factory).recordBorrower(borrower, address(this));
        state = LoanState.Accepted;
        emit LoanTermsAccepted(msg.sender, ethCollateralAmount);
    }

    // Borrower takes the loan
    function takeLoan() external payable {
        require(state == LoanState.Accepted, "Loan is not in accepted state");
        require(msg.sender == borrower, "Only borrower can take the loan");

        state = LoanState.Taken;
        loanTakenTimestamp = block.timestamp; // Store when loan was taken

        LoanFactory factoryContract = LoanFactory(factory);
        factoryContract.updateUtilizationMetrics(loanAmount,true); // Update utilization metrics in LoanFactory

        borrower.transfer(loanAmount);
        emit LoanTaken(msg.sender, loanAmount);

    }

    // Borrower repays the loan
    function repay() external payable {
        require(state == LoanState.Taken, "Loan is not in Taken state");
        require(msg.sender == borrower, "Only borrower can repay the loan");

        uint256 repaymentAmount = loanAmount + interest + feeAmount;

        require(msg.value == repaymentAmount, "Incorrect repayment amount");
        state = LoanState.Repaid;

        LoanFactory factoryContract = LoanFactory(factory);
        factoryContract.updateUtilizationMetrics(loanAmount,false); // Update utilization metrics in LoanFactory

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
        // Get oracle base rate
        (, int price, , ,) = oracle.latestRoundData();
        uint256 baseRate = uint256(price)*100 / 1e6; // Adjust based on the oracle's decimal places

        // Get utilization rate from LoanFactory
        LoanFactory loanFactory = LoanFactory(factory);
        uint256 utilizationRate = loanFactory.getUtilizationRate();
        uint256 utilizationMultiplier = 15;

        uint256 newFloatingRate = baseRate + (utilizationMultiplier*utilizationRate); // Adjust based on the oracle's decimal places
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
        require(msg.sender == borrower, "Only borrower can switch rate type");
        if (currentRateType == InterestRateType.Fixed) {
            currentRateType = InterestRateType.Floating;
        } else {
            currentRateType = InterestRateType.Fixed;
        }
    }

    function calculateInterest() external {
        require(state == LoanState.Taken, "Loan is not in Taken state");

        if(currentRateType == InterestRateType.Floating) {
            updateRates(); 
        }
        
        uint256 interestRate = (currentRateType == InterestRateType.Fixed) ? fixedRate : floatingRate;
        uint256 timeElapsed = block.timestamp - loanTakenTimestamp;
        if (interestCalculationType == InterestCalculationType.SimpleAPR) {
            calculateSimpleInterest(interestRate, timeElapsed);
        } else if (interestCalculationType == InterestCalculationType.CompoundAPY) {
            calculateCompoundInterest(interestRate, timeElapsed);

        
        } 
    }

    function calculateSimpleInterest(uint256 interestRate, uint256 timeElapsed) private {
        interest = (loanAmount * interestRate * timeElapsed) / (100 * 365 days);
    }

    function calculateCompoundInterest(uint256 interestRate, uint256 timeElapsed) private {
        uint256 daysElapsed = timeElapsed / 1 days;
        
        uint256 dailyRate = interestRate / 36500; 
        uint256 compoundFactor = 100;
        
        for (uint i = 0; i < daysElapsed; i++) {
            compoundFactor = (compoundFactor * (100 + dailyRate)) / 100;
        }
        
        interest = (loanAmount * (compoundFactor - 100)) / 100;
    }

    function getInterest() public view returns (uint256) {
        return interest;
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
    function getInterestCalculationType() public view returns (InterestCalculationType) {
        return interestCalculationType;
    }
    function getCurrentRateType() public view returns (InterestRateType) {
        return currentRateType;
    }

    event LoanFunded(address indexed lender, uint256 loanAmount);
    event LoanTermsAccepted(address indexed borrower, uint256 collateralAmount);
    event LoanTaken(address indexed borrower, uint256 loanAmount);
    event LoanRepaid(address indexed borrower, uint256 repaymentAmount);
    event LoanLiquidated(address indexed borrower, address indexed lender, uint256 collateralAmount);
}
