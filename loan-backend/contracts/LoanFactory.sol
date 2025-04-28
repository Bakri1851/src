// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "./LoanRequest.sol";
import {AggregatorV3Interface} from "./AggregatorV3Interface.sol";

contract LoanFactory {
    AggregatorV3Interface internal oracle = AggregatorV3Interface(0x8e604308BD61d975bc6aE7903747785Db7dE97e2); // Replace with actual oracle address

    mapping (address => address[]) public loansByLender;
    mapping (address => address[]) public loansByBorrower;
    address[] public allLoans;

    event LoanCreated(address indexed borrower,address indexed lender, address indexed loanContract);
    event LoanProposalCreated(uint256 proposalId, address borrower);
    event LoanProposalAccepted(uint256 proposalId, address lender, address loanAddress);

    // Variabled for liquidity tracking
    uint256 public totalLiquidity; // Total liquidity provided by lenders
    uint256 public totalBorrowed; // Total amount borrowed by borrowers
    

    struct LoanProposal {
        uint256 id;
        address borrower;
        uint256 loanAmount;
        uint256 feeAmount;
        uint256 ethCollateralAmount;
        uint256 repayByTimestamp;
        uint256 fixedRate;
        uint256 floatingRate;
        address oracle;
        bool accepted;
        address acceptedLender;
        uint256 creationTimestamp;
        uint8 interestCalculationType; // 0 for SimpleAPR, 1 for CompoundAPY

    }

    uint256 public nextProposalId;
    mapping(uint256 => LoanProposal) public proposals;
    mapping(uint256 => address) public proposalToAddress;

    
    function createProposal(
        uint256 _loanAmount,
        uint256 _feeAmount,
        uint256 _ethCollateralAmount,
        uint256 _repayByTimestamp,
        uint256 _fixedRate,
        uint256 _floatingRate,
        address _oracle,
        uint8 _interestCalculationType // 0 for SimpleAPR, 1 for CompoundAPY
    ) external {
        proposals[nextProposalId] = LoanProposal({
            id: nextProposalId,
            borrower: msg.sender,
            loanAmount: _loanAmount,
            feeAmount: _feeAmount,
            ethCollateralAmount: _ethCollateralAmount,
            repayByTimestamp: _repayByTimestamp,
            fixedRate: _fixedRate,
            floatingRate: _floatingRate,
            oracle: _oracle,
            accepted: false,
            acceptedLender: address(0),
            creationTimestamp: block.timestamp,
            interestCalculationType: _interestCalculationType // Default to SimpleAPR
        });
        emit LoanProposalCreated(nextProposalId, msg.sender);
        nextProposalId++;
    }


    function getAllOpenProposals() external view returns (LoanProposal[] memory) {
        uint256 openProposalsCount = 0;
        for (uint256 i = 0; i < nextProposalId; i++) {
            if (!proposals[i].accepted) {
                openProposalsCount++;
            }
        }

        LoanProposal[] memory openProposals = new LoanProposal[](openProposalsCount);
        uint256 index = 0;
        for (uint256 i = 0; i < nextProposalId; i++) {
            if (!proposals[i].accepted) {
                openProposals[index] = proposals[i];
                index++;
            }
        }

        return openProposals;
    }

    function acceptProposal(uint256 _proposalId) external returns (address) {
        //require(_proposalId < nextProposalId, "Invalid proposal ID");
        LoanProposal storage proposal = proposals[_proposalId];
        require(!proposal.accepted, "Proposal already accepted");

        proposal.accepted = true;
        proposal.acceptedLender = msg.sender;

        // Create a new LoanRequest contract
        LoanRequest newLoan = new LoanRequest(
            proposal.loanAmount,
            proposal.feeAmount,
            proposal.ethCollateralAmount,
            proposal.repayByTimestamp,
            proposal.fixedRate,
            proposal.floatingRate,
            proposal.oracle,
            address(this),
            msg.sender,  // Pass the original sender as lender
            proposal.creationTimestamp, // Pass the creation timestamp to the LoanRequest contract
            uint8(proposal.interestCalculationType) // Pass the interest calculation type
        );

        // Store the loan address in the mapping and array
        loansByLender[msg.sender].push(address(newLoan));
        loansByBorrower[proposal.borrower].push(address(newLoan));
        allLoans.push(address(newLoan));

        proposalToAddress[_proposalId] = address(newLoan);
        emit LoanProposalAccepted(_proposalId, msg.sender, address(newLoan));
        return address(newLoan);
    }

    function getProposal(uint256 _proposalId) external view returns (LoanProposal memory) {
        require(_proposalId < nextProposalId, "Invalid proposal ID");
        return proposals[_proposalId];
    }

    function getAddressforProposal(uint256 _proposalId) external view returns (address) {
        require(_proposalId < nextProposalId, "Invalid proposal ID");
        require(proposals[_proposalId].accepted, "Proposal not accepted yet");
        return proposalToAddress[_proposalId];
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

    // Function to update total liquidity provided by lenders
    function updateUtilizationMetrics(uint256 amountBorrowed, bool isIncrease) public {
        if (isIncrease) {
            totalBorrowed += amountBorrowed;
        } else {
            if (amountBorrowed > totalBorrowed) {
                totalBorrowed = 0;
            } else {
                totalBorrowed -= amountBorrowed;
            }
        }
    }

    function addLiquidity() public payable {
        totalLiquidity += msg.value;
    }

    function removeLiquidity(uint256 amount) public {
        require(amount <= totalLiquidity - totalBorrowed, "Insufficient liquidity");
        totalLiquidity -= amount;
        payable(msg.sender).transfer(amount);
    }

    function getUtilizationRate() public view returns (uint256) {
        if (totalLiquidity == 0) return 0;
        return (totalBorrowed * 10000) / totalLiquidity; // Returns utilization rate as a percentage * 100
    }


    function getCurrentFloatingRate() public view returns (uint256) {
        (, int price, , ,) = oracle.latestRoundData();
        uint256 baseRate = uint256(price) * 100 / 1e6; // Convert oracle price to basis points
            
        // Get utilization rate
        uint256 utilizationRate = getUtilizationRate();
        uint256 utilizationMultiplier = 15;
        
        // Calculate floating rate: baseRate + (utilizationMultiplier * utilizationRate / 10000)
        return baseRate + (utilizationMultiplier * utilizationRate / 10000);
    }

    constructor() {
    // Initialize with test values for development
    //totalLiquidity = 1000 ether;  // 1000 ETH
    //totalBorrowed = 300 ether;    // This will give 30% utilization
}
}