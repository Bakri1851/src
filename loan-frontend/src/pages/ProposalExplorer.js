import FactoryConfig from 'constants/FactoryConfig';
import { useEffect, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useSoftUIController } from 'context';
import SoftInput from 'components/SoftInput';
import SoftButton from 'components/SoftButton';
import SoftTypography from 'components/SoftTypography';
import SoftBox from 'components/SoftBox';
import { useAccount } from 'wagmi';
import { wagmiConfig } from "../wagmi.js"

export default function ProposalExplorer() {
    const {address, isConnected} = useAccount();
    const [openProposal, setOpenProposal] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedProposals, setExpandedProposals] = useState({});

    const {writeContract} = useWriteContract();
    const config = wagmiConfig;


    const {data: proposals, refetch: refetchProposals} = useReadContract({
        address: FactoryConfig.address,
        abi: FactoryConfig.abi,
        functionName: "getAllOpenProposals",
        enabled: isConnected,
    });

    useEffect(() => {
        if (proposals && proposals.length > 0) {
            setOpenProposal(proposals);
            setIsLoading(false);
        } else if (proposals && proposals.length === 0) {
            setOpenProposal([]);
            setIsLoading(false);
        }
    }, [proposals]);

    const toggleProposalDetails = (proposalId) => {
        setExpandedProposals((prev) => ({
            ...prev,
            [proposalId]: !prev[proposalId],
        }));
    }

    const handleAcceptProposal = async (proposalId) => {
        setIsLoading(true);
        try {
            await writeContract({
                address: FactoryConfig.address,
                abi: FactoryConfig.abi,
                functionName: "acceptProposal",
                args: [proposalId],
                chainId: FactoryConfig.chainId,
            });
            alert("Please confirm the transaction in your wallet.");
            
            setTimeout(() => {
                refetchProposals();
            }, 5000); // Refetch proposals after 5 seconds

        } catch (error) {
            console.error("Error accepting proposal:", error);
        } finally {
            setIsLoading(false);
        }
    }


    const formatEther = (value) => {
        if (!value) return "0.00";
        try{
            return (Number(value) / 1e18).toFixed(6);
        } catch (error) {
            console.error("Error formatting ether:", error);
            return "Error";
        }}
        
    const formatTimestamp = (timestamp) =>
        timestamp ? new Date(Number(timestamp) * 1000).toLocaleString() : "Loading...";
        
    const formatRate = (rate) =>
        rate ? `${(Number(rate) / 100).toFixed(2)}%` : "Loading...";
        
    const shortenAddress = (address) => {
        if (!address) return "Unknown";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };


    return(
        <SoftBox mt = {5} mx = "auto" p ={4} width = "80%" maxWidth = "600px" bgcolor = "white" borderRadius = "lg" boxShadow = "lg">
            <SoftTypography variant="h4" fontWeight="bold" mb={2} textAlign="center">
                Proposal Explorer
            </SoftTypography>

            {!isConnected && (
                <SoftBox textAlign="center" mt={2}>
                    <SoftTypography variant="body2" color="text" mb={1}>
                        Please connect your wallet to view proposals.
                    </SoftTypography>
                    <SoftButton variant="gradient" color="info" onClick={() => config.connect()}>
                        Connect Wallet
                    </SoftButton>
                </SoftBox>
            )}

            {isConnected && isLoading && (
                <SoftBox textAlign="center" mt={2}>
                    <SoftTypography variant="body2" color="text" mb={1}>
                        Loading proposals...
                    </SoftTypography>
                </SoftBox>
            )}

            {isConnected && !isLoading && (
                <>
                {!openProposal || openProposal.length === 0 ? (
                    <SoftTypography  mt = {2} textAlign = "center" variant = "body2">
                        No proposals found.
                    </SoftTypography>
                ):(
                    openProposal.map((proposal, index) => (
                        <SoftBox
                        key = {Number(proposal.id)}
                        mb = {3}
                        p = {2}
                        color = "info"
                        variant = "gradient"
                        boxShadow = "sm"
                        textAlign = "centre"
                        sx = {{
                            border: "2px solid",
                            borderColor: "info.main",
                            transition: "all 0.2s",
                            borderRadius: "15px",
                        }}
                        display = "flex"
                        flexDirection = "column"
                        alignItems = "center">

                        <SoftTypography variant = "h6" fontWeight = "bold" mb = {1}> Proposal ID: {Number(proposal.id)}</SoftTypography>
                        <SoftTypography variant = "body2" color = "text" mb = {1}> Borrower: {shortenAddress(proposal.borrower)}</SoftTypography>
                        <SoftTypography variant = "body2" color = "text" mb = {1}> Loan Amount: {formatEther(proposal.loanAmount)} ETH</SoftTypography>

                        {expandedProposals[Number(proposal.id)] ? (
                            <>
                                <SoftTypography variant = "body2" mt = {1}>
                                    Fee Amount: {formatEther(proposal.feeAmount)} ETH
                                </SoftTypography>
                                <SoftTypography variant = "body2" mt = {1}>
                                    Collateral Amount: {formatEther(proposal.ethCollateralAmount)} ETH
                                </SoftTypography>
                                <SoftTypography variant = "body2" mt = {1}>
                                    Repay By: {formatTimestamp(proposal.repayByTimestamp)}
                                </SoftTypography>
                                <SoftTypography variant = "body2" mt = {1}>
                                    Fixed Rate: {formatRate(proposal.fixedRate)}
                                </SoftTypography>
                                <SoftTypography variant = "body2" mt = {1}>
                                    Floating Rate: {formatRate(proposal.floatingRate)}
                                </SoftTypography>

                                <SoftButton variant = "gradient" color = "success" onClick = {() => handleAcceptProposal(Number(proposal.id))} style = {{marginTop: "12px"}} disabled = {isLoading}>
                                    Accept Proposal
                                </SoftButton>
                                <SoftButton  variant = "outlined" color = "info" onClick = {() => toggleProposalDetails(Number(proposal.id))} style = {{marginTop: "12px"}}>
                                    Hide Details
                                </SoftButton>

                            </>
                    ):(
                        <SoftButton variant = "outlined" color = "info" onClick = {() => toggleProposalDetails(Number(proposal.id))} style = {{marginTop: "12px"}}>
                            Show Details
                        </SoftButton>
                    )}

                    </SoftBox>

                )
                    )
                )}

                

                
                </>
            )}

                
                
            


        </SoftBox>
    
    
    
   
  


)}