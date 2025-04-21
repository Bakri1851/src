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

export default function MyLoans() {
    const { address, isConnected } = useAccount();
    const [userLoans, setUserLoans] = useState([]);
    const [loanDetails, setLoanDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [expandedLoans, setExpandedLoans] = useState({});
    const [refreshCounter, setRefreshCounter] = useState(0); 

    const config = wagmiConfig
    const {writeContract} = useWriteContract();
    
    const { data: lenderLoans, refetch } = useReadContract({
        address: FactoryConfig.address,
        abi: FactoryConfig.abi,
        functionName: "getLoansByLender",
        args: [address],
        enabled: !!address,
    });

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
        
        return uniqueAddresses.sort((a, b) => {
            const stateA = loanStates[a];
            const stateB = loanStates[b];
            
            if (stateA >= 1 && stateA <= 3 && stateB >= 1 && stateB <= 3) {
                return stateA - stateB; 
            }
            else if (stateA >= 1 && stateA <= 3) return -1;
            else if (stateB >= 1 && stateB <= 3) return 1;
            else return stateB - stateA;
        });
    };

    const handleRefresh = async () => {
        setIsLoading(true);
        setLoanDetails({});
        setExpandedLoans({});
        
        try {
            await refetch();
            setRefreshCounter(prev => prev + 1); 
        } catch (error) {
            console.error("Error refreshing loans:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const loadAndFilterLoans = async () => {
            if (lenderLoans && lenderLoans.length > 0) {
                setIsLoading(true);
                
                try {
                    console.log("Raw loans from contract:", lenderLoans);
                    const filteredLoans = await getFilteredLoans(lenderLoans);
                    console.log("Filtered loans:", filteredLoans);
                    setUserLoans(filteredLoans);
                } catch (error) {
                    console.error("Error filtering loans:", error);
                    setUserLoans(lenderLoans);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setUserLoans([]);
            }
        };
        
        if (lenderLoans) {
            loadAndFilterLoans();
        }
    }, [lenderLoans, address, refreshCounter]); 

    const fetchLoanDetails = async (loanAddress) => {
        setIsLoading(true);
        try {
            const lender = await readContract(config,{
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "lender",
                chainId: FactoryConfig.chainId
            });
            
            const loanAmount = await readContract(config,{
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getLoanAmount",
                chainId: FactoryConfig.chainId
            });
            
            const state = await readContract(config,{
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getLoanState",
                chainId: FactoryConfig.chainId
            });
            
            const repayByTimestamp = await readContract(config,{
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getRepayByTimestamp",
                chainId: FactoryConfig.chainId
            });
            
            const fixedRate = await readContract(config,{
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getFixedRate",
                chainId: FactoryConfig.chainId
            });
            
            const floatingRate = await readContract(config,{
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "getFloatingRate",
                chainId: FactoryConfig.chainId
            });
            
            setLoanDetails(prev => ({
                ...prev,
                [loanAddress]: { 
                    lender, 
                    loanAmount, 
                    state, 
                    repayByTimestamp, 
                    fixedRate, 
                    floatingRate 
                }
            }));
            
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

    const toggleLoanDetails = (loanAddress) => {
        if (expandedLoans[loanAddress]) {
            setExpandedLoans(prev => ({
                ...prev,
                [loanAddress]: false
            }));
        } else {
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

    const handleLiquidateLoan = async (loanAddress) => {
        try {
            await writeContract({
                address: loanAddress,
                abi: ContractConfig.abi,
                functionName: "liquidate",
                chainId: FactoryConfig.chainId
            });
            alert("Please confirm the transaction in your wallet.");
        } catch (error) {
            console.error("Error liquidating loan:", error);
            alert("Error liquidating loan. Please try again.");
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
    const formatTimestamp = (timestamp) =>
        timestamp ? new Date(Number(timestamp) * 1000).toLocaleString() : "Loading...";

    const formatEther = (value) => {
        if (!value) return "0";
        try {
            return (Number(value) / 1e18).toFixed(6);
        } catch (e) {
            return "Error";
        }
    };

    const formatRate = (rate) =>
        rate ? `${(Number(rate) / 100).toFixed(2)}%` : "Loading..."
      

    return (
        <SoftBox mt={5} mx="auto" p="4" width="fit-content" backgroundColor="white" boxShadow="lg" textAlign="center">
            <SoftTypography variant="h4" fontWeight="bold" mb={2} textAlign="center">
                Loans You Funded
            </SoftTypography>
            
            {/* Add refresh button */}
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
                                borderRadius: "15px",
                                transition: "all 0.2s"
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
                                        Repay By : {formatTimestamp(loanDetails[loanAddress].repayByTimestamp)}
                                    </SoftTypography>

                                    <SoftTypography variant="body2" mt={1}>
                                        Fixed Rate: {formatRate(loanDetails[loanAddress].fixedRate)}
                                    </SoftTypography>
                                    
                                    <SoftTypography variant="body2" mt={1}>
                                        Status: {formatState(loanDetails[loanAddress].state)}
                                    </SoftTypography>

                                    {((loanDetails[loanAddress].state == 3) && (loanDetails[loanAddress].repayByTimestamp && Number(loanDetails[loanAddress].repayByTimestamp)<Math.floor(Date.now()/1000))) && (
                                        <SoftButton
                                            variant="outlined"
                                            color="error"
                                            onClick={() => handleLiquidateLoan(loanAddress)}
                                            style={{ marginTop: "12px" }}
                                            
                                        >
                                            Liquidate Loan
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