import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContract, useWriteContract } from "wagmi"
import { readContract } from "wagmi/actions"
import ContractConfig from "constants/ContractConfig"
import FactoryConfig from "constants/FactoryConfig"
import { getFactoryConfig } from "constants/FactoryConfig"
import { useEffect, useState } from "react"
import { wagmiConfig } from "../wagmi.js"

export default function MyBorrowedLoans() {
    const { address, isConnected } = useAccount();
    const [userLoans, setUserLoans] = useState([]);
    const [loanDetails, setLoanDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [expandedLoans, setExpandedLoans] = useState({}); // Track which loans are expanded

    const { writeContract } = useWriteContract()
    const config = wagmiConfig
    
    const { data: borrowerLoans } = useReadContract({
        address: FactoryConfig.address,
        abi: FactoryConfig.abi,
        functionName: "getLoansByBorrower",
        args: [address],
        enabled: !!address,
    });

    useEffect(() => {
        if (borrowerLoans && borrowerLoans.length > 0) {
            setUserLoans(borrowerLoans);
        }
    }, [borrowerLoans, address]);

    const fetchLoanDetails = async (loanAddress) => {
        setIsLoading(true);
        try {
            // Make separate calls with complete config objects
            const borrower = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "borrower",
                chainId: FactoryConfig.chainId
            });
            
            const loanAmount = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getLoanAmount",
                chainId: FactoryConfig.chainId
            });
            
            const state = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getLoanState",
                chainId: FactoryConfig.chainId
            });

            const repayByTimestamp = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getRepayByTimestamp",
                chainId: FactoryConfig.chainId
            });

            const fixedRate = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getFixedRate",
                chainId: FactoryConfig.chainId
            });

            const floatingRate = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getFloatingRate",
                chainId: FactoryConfig.chainId
             });
            
            const collateralAmount = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getEthCollateralAmount",
                chainId: FactoryConfig.chainId
            });
            
            const rateType = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "currentRateType",
                chainId: FactoryConfig.chainId
            });

            setLoanDetails(prev => ({
                ...prev,
                [loanAddress]: { borrower, loanAmount, state, collateralAmount, repayByTimestamp, fixedRate, floatingRate, rateType }
            }));
            
            // Mark this loan as expanded
            setExpandedLoans(prev => ({
                ...prev,
                [loanAddress]: true
            }));
        } catch (error) {
            console.error("Error fetching loan details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle loan details visibility
    const toggleLoanDetails = (loanAddress) => {
        if (expandedLoans[loanAddress]) {
            // Hide details - leave details data in place for quick re-showing
            setExpandedLoans(prev => ({
                ...prev,
                [loanAddress]: false
            }));
        } else {
            // If we already have the details, just show them, otherwise fetch
            if (loanDetails[loanAddress]) {
                setExpandedLoans(prev => ({
                    ...prev,
                    [loanAddress]: true
                }));
            } else {
                fetchLoanDetails(loanAddress);
            }
        }
    };

    const handleRepayLoan = async (loanAddress) => {
        try {

            await readContract(config,{
                address: loanAddress,
                abi: ContractConfig.abi,
                chainId: FactoryConfig.chainId,
                functionName: "calculateInterest",
            });

            const interest = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                chainId: FactoryConfig.chainId,
                functionName: "getInterest",}
            );

            const loanAmount = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getLoanAmount",
                chainId: FactoryConfig.chainId,
            });

            console.log("interest", interest.toString())
            const totalRepayment = loanAmount + interest;
            console.log("totalRepayment", totalRepayment.toString())
            await writeContract({
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "repay",
                value: totalRepayment,
                chainId: FactoryConfig.chainId,
            });
            alert("Please confirm the transaction in your wallet.");
        } catch (error) {
            console.error("Error repaying loan:", error);
            alert("Error repaying loan. Please try again.");
        }
    }

    const handleSwitchRate = async (loanAddress) => {
        try {
            await writeContract({
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "switchRateType",
                chainId: FactoryConfig.chainId,
            });
            alert("Please confirm the transaction in your wallet.");
        } catch (error) {
            console.error("Error switching rate:", error);
            alert("Error switching rate. Please try again.")
        }
    }

    const formatState = (state) => {
        const states = [
            "Created",
            "Funded",
            "Accepted",
            "Taken",
            "Repaid",
            "Liquidated",
        ];
        return states[state] || "Unknown";
    };

    const formatEther = (value) => {
        if (!value) return "0";
        try {
            return (Number(value) / 1e18).toFixed(6);
        } catch (e) {
            return "Error";
        }
    };

    const formatTimestamp = (timestamp) =>
        timestamp ? new Date(Number(timestamp) * 1000).toLocaleString() : "Loading...";

    const formatRate = (rate) =>
        rate ? `${(Number(rate) / 100).toFixed(2)}%` : "Loading...";

    const rateTypeLabel = {
        0: "Fixed",
        1: "Floating",
      }

    return (
        <SoftBox mt={5} mx="auto" p="4" width="fit-content" backgroundColor="white" boxShadow="lg" textAlign="center">
            <SoftTypography variant="h4" fontWeight="bold" mb={2} textAlign="center">
                Loans You Borrowed
            </SoftTypography>
            {!isConnected && (
                <SoftTypography mt variant="body2">
                    Please connect your wallet to view your loans.
                </SoftTypography>
            )}
            {isConnected && isLoading && (
                <SoftTypography variant="body2">Loading loans...</SoftTypography>
            )}
            {isConnected && !isLoading && (
                <>
                {(!userLoans || userLoans.length === 0) ? (
                    <SoftTypography mt variant="body2" textAlign="center">No loans found.</SoftTypography>
                ) : (
                    userLoans.map((loanAddress, index) => (
                        <SoftBox 
                            key={index} 
                            mb={3} 
                            p={2} 
                            color="info" 
                            variant="gradient" 
                            boxShadow="sm" 
                            textAlign="center"
                            sx={{
                                border: "2px solid", 
                                borderColor: "info.main",
                                transition: "all 0.2s",
                                borderRadius: "15px",
                            }}
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                        >
                            <SoftTypography variant="h6" fontWeight="bold" mb={1}>Loan Address:</SoftTypography>
                            <SoftTypography variant="body2" mb={2} style={{wordBreak: "break-all"}}>{loanAddress}</SoftTypography>
                            
                            {loanDetails[loanAddress] && expandedLoans[loanAddress] ? (
                                <>
                                    <SoftTypography variant="body2" mt={1}>
                                        Loan Amount: {formatEther(loanDetails[loanAddress].loanAmount)} ETH
                                    </SoftTypography>
                                    
                                    <SoftTypography variant="body2" mt={1}>
                                        Collateral: {formatEther(loanDetails[loanAddress].collateralAmount)} ETH
                                    </SoftTypography>

                                    <SoftTypography variant="body2" mt={1}>
                                        Repay by: {formatTimestamp(loanDetails[loanAddress].repayByTimestamp)}
                                    </SoftTypography>

                                    <SoftTypography variant="body2" mt={1}>
                                        Rate Type: {rateTypeLabel[loanDetails[loanAddress].rateType] || "Unknown"}
                                    </SoftTypography>
                                    
                                    <SoftTypography variant="body2" mt={1}>
                                        Status: {formatState(loanDetails[loanAddress].state)}
                                    </SoftTypography>

                                    {loanDetails[loanAddress].state < 4 && (
                                        <SoftButton
                                            variant="outlined" 
                                            color="info" 
                                            onClick={() => handleSwitchRate(loanAddress)}
                                            style={{ marginTop: "12px" }}
                                        >
                                            Switch Rate
                                        </SoftButton>
                                    )}

                                    {loanDetails[loanAddress].state === 3 && (
                                        <SoftButton
                                            variant="outlined" 
                                            color="info" 
                                            onClick={() => handleRepayLoan(loanAddress)}
                                            style={{ marginTop: "12px" }}
                                        >
                                            Repay Loan
                                        </SoftButton>
                                    )}


                                    <SoftButton 
                                        variant="outlined" 
                                        color="info" 
                                        onClick={() => toggleLoanDetails(loanAddress)}
                                        style={{ marginTop: "12px" }}
                                    >
                                        Hide Details
                                    </SoftButton>


                                </>
                            ) : (
                                <SoftButton 
                                    variant="outlined" 
                                    color="info" 
                                    onClick={() => toggleLoanDetails(loanAddress)}
                                >
                                    View Details
                                </SoftButton>
                            )}
                        </SoftBox>
                    ))
                )}
                </>
            )}
        </SoftBox>
    );
}