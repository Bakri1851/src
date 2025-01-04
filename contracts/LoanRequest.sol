// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;
import {IERC20} from "./IERC20.sol";
import "hardhat/console.sol";


contract LoanRequest {
    struct Terms {
        
        uint256 loanDaiAmount;
        uint256 feeDaiAmount;
        uint256 ethCollateralAmount;
        uint256 repayByTimestamp;

        uint256 fixedRate;
        uint256 floatingRate;
    }
        
    Terms public terms;
    
    enum LoanState {Created, Funded, Taken, Repaid, Liquidated}
    enum InterestRateType {Fixed, Floating}
    LoanState public state;
    InterestRateType public rateType;

    event LoanFunded(address indexed lender, uint256 loanDaiAmount);
    event LoanTaken(address indexed borrower, uint256 collateralAmount, uint256 loanAmount);
    event LoanRepaid(address indexed borrower, uint256 repaymentAmount, uint256 interestAmount);
    event LoanLiquidated(address indexed lender, uint256 collateralAmount);

    event RateSwitched(address indexed borrower, InterestRateType newLoanType);
    event ConstructorInitialized(
                uint256 loanDaiAmount,
                uint256 feeDaiAmount,
                uint256 ethCollateralAmount,
                uint256 repayByTimestamp,
                uint256 fixedRate,
                uint256 floatingRate,
                address daiAddress
        );


    modifier onlyInState(LoanState expectedState) { require(state == expectedState, "Not allowed in this state");_;}

    address payable public lender;
    address payable public borrower;
    address public daiAddress;

    constructor(Terms memory _terms, address _daiAddress){
        require(_daiAddress != address(0), "Invalid DAI address");
        require(_terms.loanDaiAmount > 0, "Loan amount must be greater than 0");
        require(_terms.feeDaiAmount >= 0, "Fee must be non-negative");
        require(_terms.ethCollateralAmount > 0, "Collateral must be greater than 0");
        require(_terms.repayByTimestamp > block.timestamp, "Repay timestamp must be in the future");

        terms = _terms;
        daiAddress = _daiAddress;
        lender = payable(msg.sender);

        state = LoanState.Created;

        rateType = InterestRateType.Fixed;

        emit ConstructorInitialized(
            _terms.loanDaiAmount,
            _terms.feeDaiAmount,
            _terms.ethCollateralAmount,
            _terms.repayByTimestamp,
            _terms.fixedRate,
            _terms.floatingRate,
            _daiAddress
        );
    }

function fundLoan() public onlyInState(LoanState.Created){
        require(msg.sender != borrower, "Borrower cannot fund loan");
        require(IERC20(daiAddress).transferFrom(msg.sender,address(this), terms.loanDaiAmount), "Transfer failed");
        state = LoanState.Funded;
        lender = payable(msg.sender);
        emit LoanFunded(msg.sender, terms.loanDaiAmount);
}

function takeALoanAndAcceptLoanTerms() public payable onlyInState(LoanState.Funded){
        require(msg.value == terms.ethCollateralAmount, "Invalid collateral amount");
        borrower = payable(msg.sender);
        state = LoanState.Taken;
        require(IERC20(daiAddress).transfer(borrower, terms.loanDaiAmount), "Transfer to borrower failed");
        emit LoanTaken(msg.sender, msg.value, terms.loanDaiAmount);
}

function switchRate() public onlyInState(LoanState.Taken){
        require(msg.sender == borrower, "Only borrower can switch rates");
        rateType = (rateType == InterestRateType.Fixed) ? InterestRateType.Floating : InterestRateType.Fixed;
        emit RateSwitched(msg.sender, rateType);
}


function repay() public onlyInState(LoanState.Taken){
        require(msg.sender == borrower, "Only the borrower can repay the loan");

        uint256 interestRate = (rateType == InterestRateType.Fixed) ? terms.fixedRate : terms.floatingRate;
        uint256 interestPaid = (terms.loanDaiAmount*interestRate)/10000;
        uint256 repaymentAmount = terms.loanDaiAmount + interestPaid;
        require(IERC20(daiAddress).transferFrom(borrower, lender, repaymentAmount),"DAI transfer failed");

        state = LoanState.Repaid;

        (bool success,) = borrower.call{value:terms.ethCollateralAmount}("");
        require(success,"Collateral refund failed");

        emit LoanRepaid(msg.sender,repaymentAmount,interestPaid);
}

function liquidate() public onlyInState(LoanState.Taken){
require(msg.sender == lender, "Only lender can liquidate loan");
require(block.timestamp >= terms.repayByTimestamp, "Can not liquidate before loan is due");
state = LoanState.Liquidated;

(bool success,) = lender.call{value:terms.ethCollateralAmount}("");
require(success,"Collateral refund failed");

emit LoanLiquidated(msg.sender,terms.ethCollateralAmount);
}


}
