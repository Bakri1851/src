pragma solidity ^0.8.0;
import "./LoanRequest.sol";

contract LoanFactory {
    mapping (address => address[]) public loansByLender;
    mapping (address => address[]) public loansByBorrower;
    address[] public allLoans;

    event LoanCreated(address indexed borrower,address indexed lender, address indexed loanContract);

    function createLoan(
        uint256 loanAmount,
        uint256 feeAmount,
        uint256 ethCollateralAmount,
        uint256 repayByTimestamp,
        uint256 fixedRate,
        uint256 floatingRate,
        address oracle
    ) external returns (address) {
        // Create a new LoanRequest contract
        LoanRequest newLoan = new LoanRequest(
            loanAmount,
            feeAmount,
            ethCollateralAmount,
            repayByTimestamp,
            fixedRate,
            floatingRate,
            oracle,
            address(this),
            msg.sender  // Pass the actual lender address
        );

        // Store the loan address in the mapping and array
        loansByLender[msg.sender].push(address(newLoan));
        allLoans.push(address(newLoan));

        emit LoanCreated(address(0), msg.sender, address(newLoan));
        return address(newLoan);
    }

    
    function getAllLoans() external view returns (address[] memory) {
        return allLoans;
    }

    function isFactoryLoan(address _loan) public view returns (bool) {
        for (uint256 i = 0; i < allLoans.length; i++) {
            if (allLoans[i] == _loan) {
                return true;
            }
        }
        return false;
    }

    function recordBorrower(address _borrower, address _loan) external {
        require(isFactoryLoan(_loan), "Not a factory loan");
        loansByBorrower[_borrower].push(_loan);
    }

    function getLoansByLender(address _lender) external view returns (address[] memory) {
        return loansByLender[_lender];
    }

    function getLoansByBorrower(address _borrower) external view returns (address[] memory) {
        return loansByBorrower[_borrower];
    }
}