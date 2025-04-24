import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { useAccount, useReadContract, useWriteContract } from "wagmi"
import { readContract } from "wagmi/actions"
import ContractConfig from "constants/ContractConfig"
import FactoryConfig from "constants/FactoryConfig"
import { useEffect, useState } from "react"
import { wagmiConfig } from "../wagmi.js"
import useOpenAI from "hooks/useOpenAI.js"
import ReactMarkdown from "react-markdown"
import { formatEther, formatTimestamp, formatState, formatRate, rateTypeLabel} from "utils/formatters.js"
import { WifiTetheringOffTwoTone } from "@mui/icons-material"


export default function MyBorrowedLoans() {
    const { address, isConnected } = useAccount();
    const [userLoans, setUserLoans] = useState([]);
    const [loanDetails, setLoanDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [expandedLoans, setExpandedLoans] = useState({}); 
    const [refreshCounter, setRefreshCounter] = useState(0); 

    const [aiAnalysis, setAiAnalysis] = useState({});
    const [aiLoading, setAiLoading] = useState(false);

    const {analyseLoanTerms} = useOpenAI()

    const { writeContract } = useWriteContract()
    const config = wagmiConfig
    
    const { data: borrowerLoans, refetch } = useReadContract({
        address: FactoryConfig.address,
        abi: FactoryConfig.abi,
        functionName: "getLoansByBorrower",
        args: [address],
        enabled: !!address,
    });


    const getAIAnalysis = async (loanAddress) => {
        if (aiAnalysis[loanAddress]) return;

        setAiLoading(prev => ({...prev,[loanAddress]: true}));

        try{
            const analysis = await analyseLoanTerms({
                loanAmount: formatEther(loanDetails[loanAddress].loanAmount),
                collateral: formatEther(loanDetails[loanAddress].collateralAmount),
                fixedRate: formatRate(loanDetails[loanAddress].fixedRate),
                floatingRate: formatRate(loanDetails[loanAddress].floatingRate),
                repayByTimestamp: formatTimestamp(loanDetails[loanAddress].repayByTimestamp),
                state: formatState(loanDetails[loanAddress].state),
                rateType: rateTypeLabel[loanDetails[loanAddress].rateType],
            })
            setAiAnalysis(prev => ({...prev,[loanAddress]: analysis}));

        } catch (error) {
            console.error("Error fetching AI analysis:", error);
        } finally {
            setAiLoading(prev => ({...prev,[loanAddress]: false}));
        }

    }

    const getFilteredLoans = async (loanAddresses) => {
        if (!loanAddresses || loanAddresses.length === 0) return [];
        
        const uniqueAddresses = [...new Set(loanAddresses)];
        const loanStates = {};
        
        for (const address of uniqueAddresses) {
            try {
                const state = await readContract(config, {
                    address: address,
                    abi: ContractConfig.abi,
                    functionName: "getLoanState",
                    chainId: FactoryConfig.chainId
                });
                loanStates[address] = Number(state);
            } catch (error) {
                console.error(`Error fetching state for loan ${address}:`, error);
                loanStates[address] = -1; 
            }
        }
        
        console.log("Loan states before filtering:", loanStates);
        
        // Sort loans by state (higher state = more advanced in lifecycle)
        return uniqueAddresses.sort((a, b) => {
            // Prioritize loans that are in active states (1-3) over others
            const stateA = loanStates[a];
            const stateB = loanStates[b];
            
            // Active loans (1-3) come first, sorted by state
            if (stateA >= 1 && stateA <= 3 && stateB >= 1 && stateB <= 3) {
                return stateA - stateB; // Show lower states first (e.g., Funded before Taken)
            }
            // Active loans before completed loans
            else if (stateA >= 1 && stateA <= 3) return -1;
            else if (stateB >= 1 && stateB <= 3) return 1;
            // For non-active loans, show higher states first (e.g., Repaid before Created)
            else return stateB - stateA;
        });
    };

    // Handle manual refresh
    const handleRefresh = async () => {
        setIsLoading(true);
        setLoanDetails({});
        setExpandedLoans({});
        
        try {
            await refetch();
            setRefreshCounter(prev => prev + 1); // Trigger re-filtering
        } catch (error) {
            console.error("Error refreshing loans:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const loadAndFilterLoans = async () => {
            if (borrowerLoans && borrowerLoans.length > 0) {
                setIsLoading(true);
                
                try {
                    console.log("Raw loans from contract:", borrowerLoans);
                    const filteredLoans = await getFilteredLoans(borrowerLoans);
                    console.log("Filtered loans:", filteredLoans);
                    setUserLoans(filteredLoans);
                } catch (error) {
                    console.error("Error filtering loans:", error);
                    // Fall back to unfiltered list in case of error
                    setUserLoans(borrowerLoans);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setUserLoans([]);
            }
        };
        
        if (borrowerLoans) {
            loadAndFilterLoans();
        }
    }, [borrowerLoans, address, refreshCounter]); // Added refreshCounter to trigger re-filtering

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

            const feeAmount = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getFeeAmount",
                chainId: FactoryConfig.chainId
            });

            const interest = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getInterest",
                chainId: FactoryConfig.chainId
            });

            setLoanDetails(prev => ({
                ...prev,
                [loanAddress]: { borrower, loanAmount, state, collateralAmount, repayByTimestamp, fixedRate, floatingRate, rateType, interest, feeAmount }
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

    const handleAcceptLoan = async (loanAddress) => {
        try {
            const balance = BigInt(await window.ethereum.request({ method: 'eth_getBalance', params: [address, 'latest'] }));

            const collateralAmount = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getEthCollateralAmount",
                chainId: FactoryConfig.chainId,
            });

            if (balance < collateralAmount) {
                alert("Insufficient balance to accept loan terms. Please fund your wallet and try again.")
                return;
            }

            await writeContract({
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "acceptLoanTerms",
                chainId: FactoryConfig.chainId,
                value: collateralAmount,
            });
            alert("Please confirm the transaction in your wallet.");
            
            setTimeout(async () => {
                setLoanDetails({});
                setExpandedLoans({});
                
                const updatedLoans = await readContract(config, {
                    address: FactoryConfig.address,
                    abi: FactoryConfig.abi,
                    functionName: "getLoansByBorrower",
                    args: [address],
                    chainId: FactoryConfig.chainId,
                });
                
                if (updatedLoans) {
                    setUserLoans(updatedLoans);
                }
            }, 3000); 
            
        } catch (error) {
            console.error("Error accepting loan:", error);
        }
    }

    const handleTakeLoan = async (loanAddress) => {
        try {
            await writeContract({
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "takeLoan",
                chainId: FactoryConfig.chainId,
            });
            alert("Please confirm the transaction in your wallet.");
        } catch (error) {
            console.error("Error taking loan:", error);
        }
    }

    const handleRepayLoan = async (loanAddress) => {
        try {
            const balance = BigInt(await window.ethereum.request({ method: 'eth_getBalance', params: [address, 'latest'] }));

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

            const fee = await readContract(config, {
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getFeeAmount",
                chainId: FactoryConfig.chainId,
            });


            const totalRepayment = loanAmount + interest + fee;
            if (balance < totalRepayment) {
                alert("Insufficient balance to repay loan. Please fund your wallet and try again.")
                return;
            }

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
    

    return (
        <SoftBox mt={5} mx="auto" p="4" width="fit-content" backgroundColor="white" boxShadow="lg" textAlign="center">
            <SoftTypography variant="h4" fontWeight="bold" mb={2} textAlign="center">
                Loans You Borrowed
            </SoftTypography>
            
            {isConnected && (
                <SoftBox display="flex" justifyContent="center" mb={2}>
                    <SoftButton 
                        variant="gradient"
                        color="info"
                        size="small"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Refresh Loans"}
                    </SoftButton>
                </SoftBox>
            )}
            
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
                                        Repayment Amount: {formatEther(loanDetails[loanAddress].loanAmount + loanDetails[loanAddress].interest + loanDetails[loanAddress].feeAmount)} ETH
                                    </SoftTypography>

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
                                        Fixed Rate: {formatRate(loanDetails[loanAddress].fixedRate)}
                                    </SoftTypography>

                                    <SoftTypography variant="body2" mt={1}>
                                        Floating Rate: {formatRate(loanDetails[loanAddress].floatingRate)}
                                    </SoftTypography>
                                    
                                    <SoftTypography variant="body2" mt={1}>
                                        Status: {formatState(loanDetails[loanAddress].state)}
                                    </SoftTypography>

                                    {loanDetails[loanAddress].state === 1 && (
                                        <SoftButton
                                            variant="gradient"
                                            color="info"
                                            onClick={() => handleAcceptLoan(loanAddress)}
                                            style={{ marginTop: "12px" }}
                                        >
                                            Give Collateral
                                        </SoftButton>
                                    )}

                                    {loanDetails[loanAddress].state === 2 && (
                                        <SoftButton
                                            variant="gradient"
                                            color="info"
                                            onClick={() => handleTakeLoan(loanAddress)}
                                            style={{ marginTop: "12px" }}
                                        >
                                            Take Loan
                                        </SoftButton>
                                    )}

                                    {loanDetails[loanAddress].state === 3 && (
                                        <SoftButton
                                            variant="gradient" 
                                            color="info" 
                                            onClick={() => handleRepayLoan(loanAddress)}
                                            style={{ marginTop: "12px" }}
                                        >
                                            Repay Loan
                                        </SoftButton>
                                    )}

                                    {loanDetails[loanAddress].state < 4 && (
                                        <SoftButton
                                            variant="gradient" 
                                            color="info" 
                                            onClick={() => handleSwitchRate(loanAddress)}
                                            style={{ marginTop: "12px" }}
                                        >
                                            Switch Rate
                                        </SoftButton>
                                    )}

                                    <SoftButton
                                        variant="gradient" 
                                        color="info" 
                                        onClick={() => getAIAnalysis(loanAddress)}
                                        style={{ marginTop: "12px" }}
                                    >
                                        {aiLoading[loanAddress] ? "Thinking..." : "Get AI Analysis"}
                                    </SoftButton>

                                    {aiAnalysis[loanAddress] && (
                                        <SoftBox 
                                            mt={2}
                                            p={2}
                                            border="1px dashed"
                                            borderColor="info.main"
                                            borderRadius="10px"
                                            backgroundColor="rgba(0, 142, 255, 0.1)"
                                            width="100%"
                                            textAlign="left"
                                            maxHeight="300px"
                                            maxWidth="800px"
                                            overflow="auto"
                                            mb={3}
                                            sx={{
                                                '&::-webkit-scrollbar': {
                                                    width: '8px',
                                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    borderRadius: '4px',
                                                    backgroundColor: 'rgba(0, 142, 255, 0.3)',
                                                },
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            <SoftTypography variant="h6" fontWeight="bold" color="info.main" mb={1}>
                                                AI Suggestions:
                                            </SoftTypography>
                                            <SoftBox sx={{
                                                '& h1, & h2, & h3, & h4, & h5, & h6': {
                                                    color: 'info.main',
                                                    fontSize: '1rem',
                                                    fontWeight: 'bold',
                                                    mt: 1,
                                                    mb: 0.5
                                                },
                                                '& ul, & ol': {
                                                    pl: 2
                                                },
                                                '& p': {
                                                    mb: 1
                                                }
                                            }}>
                                                <ReactMarkdown>
                                                    {aiAnalysis[loanAddress]}
                                                </ReactMarkdown>
                                            </SoftBox>
                                        </SoftBox>
                                    )}


                                    <SoftButton 
                                        variant="gradient" 
                                        color="info" 
                                        onClick={() => toggleLoanDetails(loanAddress)}
                                        style={{ marginTop: "12px" }}
                                    >
                                        Hide Details
                                    </SoftButton>


                                </>
                            ) : (
                                <SoftButton 
                                    variant="gradient" 
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