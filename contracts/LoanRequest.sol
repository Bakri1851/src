// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import {IERC20} from "./IERC20.sol";
import "hardhat/console.sol";
import {AggregatorV3Interface} from "./AggregatorV3Interface.sol";


contract LoanRequest {
    enum LoanState { Created, Funded, Taken, Repaid, Liquidated }
    enum InterestRateType { Fixed, Floating }

    LoanState public state;
    InterestRateType public currentRateType;

    AggregatorV3Interface internal interestRateFeed;


    address public lender;
    address public borrower;
    IERC20 public daiToken;
    uint256 public loanDaiAmount;
    uint256 public feeDaiAmount;
    uint256 public ethCollateralAmount;
    uint256 public repayByTimestamp;
    uint256 public fixedRate; // in basis points
    uint256 public floatingRate; // in basis points

    constructor(
        uint256 _loanDaiAmount,
        uint256 _feeDaiAmount,
        uint256 _ethCollateralAmount,
        uint256 _repayByTimestamp,
        uint256 _fixedRate,
        uint256 _floatingRate,
        address _daiToken,
        address _oracleAddress
    ) {
        lender = msg.sender;
        loanDaiAmount = _loanDaiAmount;
        feeDaiAmount = _feeDaiAmount;
        ethCollateralAmount = _ethCollateralAmount;
        repayByTimestamp = _repayByTimestamp;
        fixedRate = _fixedRate;
        floatingRate = _floatingRate;
        daiToken = IERC20(_daiToken);
        state = LoanState.Created;
        currentRateType = InterestRateType.Fixed; // Default to fixed rate
        interestRateFeed = AggregatorV3Interface(_oracleAddress);
    }

    function fundLoan() external {
        require(state == LoanState.Created, "Loan is not in Created state");
        require(msg.sender == lender, "Only lender can fund the loan");
        state = LoanState.Funded;
    }

    function takeALoanAndAcceptLoanTerms() external payable {
        require(state == LoanState.Funded, "Loan is not in Funded state");
        require(msg.sender != lender, "Lender cannot take the loan");
        require(msg.value == ethCollateralAmount, "Incorrect collateral amount");
        borrower = msg.sender;
        state = LoanState.Taken;
    }

    function repay() external {
        require(state == LoanState.Taken, "Loan is not in Taken state");
        require(msg.sender == borrower, "Only borrower can repay the loan");

        uint256 interestPaid = (loanDaiAmount * fixedRate) / 10000; // Using fixed rate for now
        uint256 repaymentAmount = loanDaiAmount + interestPaid;

        require(daiToken.transferFrom(borrower, lender, repaymentAmount), "DAI transfer failed");

        state = LoanState.Repaid;

        (bool success,) = borrower.call{value: ethCollateralAmount}("");
        require(success, "Collateral refund failed");

        emit LoanRepaid(msg.sender, repaymentAmount, interestPaid);
    }

    function liquidate() external {
        require(state == LoanState.Taken, "Loan is not in Taken state");
        require(block.timestamp > repayByTimestamp, "Repayment deadline has not passed");
        require(msg.sender == lender, "Only lender can liquidate the loan");

        state = LoanState.Liquidated;

        (bool success,) = lender.call{value: ethCollateralAmount}("");
        require(success, "Collateral transfer failed");

        emit LoanLiquidated(borrower, lender, ethCollateralAmount);
    }

    function updateFloatingRate() public{
        (, int rate,,,) = interestRateFeed.latestRoundData();
        require(rate > 0, "Invalid price");
        floatingRate = uint256(rate);

    }
    
    function getFloatingRate() public view returns (uint256){
        return floatingRate;
    }

    event LoanRepaid(address indexed borrower, uint256 repaymentAmount, uint256 interestPaid);
    event LoanLiquidated(address indexed borrower, address indexed lender, uint256 collateralAmount);
}
