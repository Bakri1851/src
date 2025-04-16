import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContract } from "wagmi"
import { readContract } from "wagmi/actions"
import ContractConfig from "constants/ContractConfig"
import FactoryConfig from "constants/FactoryConfig"
import { getFactoryConfig } from "constants/FactoryConfig"
import { useEffect, useState } from "react"
import  {wagmiConfig}  from "../wagmi.js"

export default function MyLoans() {
    const { address, isConnected } = useAccount();
    const [userLoans, setUserLoans] = useState([]);
    const [loanDetails, setLoanDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const config = wagmiConfig
    
    const { data: lenderLoans } = useReadContract({
        address: FactoryConfig.address,
        abi: FactoryConfig.abi,
        functionName: "getLoansByLender",
        args: [address],
        enabled: !!address,
    });

    useEffect(() => {
        if (lenderLoans && lenderLoans.length > 0) {
            setUserLoans(lenderLoans);
            lenderLoans.forEach(loanAddress => {
                fetchLoanDetails(loanAddress);
            });
        }
    }, [lenderLoans, address]);

    const fetchLoanDetails = async (loanAddress) => {
        setIsLoading(true);
        try {
            // Make separate calls with complete config objects
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
            
            setLoanDetails(prev => ({
                ...prev,
                [loanAddress]: { lender, loanAmount, state }
            }));
        } catch (error) {
            console.error("Error fetching loan details:", error);
        } finally {
            setIsLoading(false);
        }
    };

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

    return (
        <SoftBox mt={5} mx="auto" p="4" width="fit-content" backgroundColor="white" boxShadow="lg" textAlign="center">
            <SoftTypography variant="h4" fontWeight="bold" mb={2} textAlign="center">
                Loans You Funded
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
                                transition: "all 0.2s"
                            }}
                        >
                            <SoftTypography variant="h6" fontWeight="bold" mb={1}>Loan Address:</SoftTypography>
                            <SoftTypography variant="body2" mb={2} style={{wordBreak: "break-all"}}>{loanAddress}</SoftTypography>
                            
                            {loanDetails[loanAddress] ? (
                                <>
                                    <SoftTypography variant="body2" mt={1}>
                                        Loan Amount: {formatEther(loanDetails[loanAddress].loanAmount)} ETH
                                    </SoftTypography>
                                    
                                    <SoftTypography variant="body2" mt={1}>
                                        Status: {formatState(loanDetails[loanAddress].state)}
                                    </SoftTypography>
                                </>
                            ) : (
                                <SoftButton 
                                    variant="outlined" 
                                    color="info" 
                                    onClick={() => fetchLoanDetails(loanAddress)}
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