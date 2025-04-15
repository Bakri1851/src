import "./LoanRequest.sol";

contract LoanFactory {
    mapping (address => address[]) public loansByUser;
    address[] public allLoans;

    event LoanCreated(address indexed user, address indexed loanContract);

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
            oracle

        );

        // Store the loan address in the mapping and array
        loansByUser[msg.sender].push(address(newLoan));
        allLoans.push(address(newLoan));
        return address(newLoan);
    }

    function getUserLoans(address user) external view returns (address[] memory) {
        return loansByUser[user];
    }

    function getAllLoans() external view returns (address[] memory) {
        return allLoans;
    }

}