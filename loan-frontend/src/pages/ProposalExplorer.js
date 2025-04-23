import FactoryConfig from 'constants/FactoryConfig';
import { useEffect, useState } from 'react';
import { useWriteContract, useReadContract } from 'wagmi';
import SoftButton from 'components/SoftButton';
import SoftTypography from 'components/SoftTypography';
import SoftBox from 'components/SoftBox';
import { useAccount } from 'wagmi';
import { wagmiConfig } from "../wagmi.js"
import { readContract} from '@wagmi/core';
import ContractConfig from 'constants/ContractConfig';
import useOpenAI from 'hooks/useOpenAI.js';
import ReactMarkdown from 'react-markdown';


export default function ProposalExplorer() {
    const {address, isConnected} = useAccount();
    const [openProposal, setOpenProposal] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedProposals, setExpandedProposals] = useState({});

    const [aiAnalysis, setAiAnalysis] = useState({});
    const [aiLoading, setAiLoading] = useState({});

    const[proposalStatus, setProposalStatus] = useState({});
    const [acceptedProposal, setAcceptedProposal] = useState([]);

    const {writeContract} = useWriteContract();
    const config = wagmiConfig;


    const {data: proposals, refetch: refetchProposals} = useReadContract({
        address: FactoryConfig.address,
        abi: FactoryConfig.abi,
        functionName: "getAllOpenProposals",
        enabled: isConnected,
    });

    const {analyseProposal} = useOpenAI();

    const getAIAnalysis = async (proposalId) => {
        const proposal = allDisplayProposals.find((p) => Number(p.id) === Number(proposalId));
        if (!proposal) return;

        setAiLoading((prev) => ({...prev,[proposalId]: true }));
        
        try {
            const analysis = await analyseProposal({
                loanAmount: formatEther(proposal.loanAmount),
                feeAmount: formatEther(proposal.feeAmount),
                ethCollateralAmount: formatEther(proposal.ethCollateralAmount),
                repayByTimestamp: formatTimestamp(proposal.repayByTimestamp),
                fixedRate: formatRate(proposal.fixedRate),
                floatingRate: formatRate(proposal.floatingRate),
            });
            setAiAnalysis((prev) => ({...prev, [proposalId]: analysis,}));
        } catch (error) {
            console.error("Error fetching AI analysis:", error);
        } finally {
            setAiLoading((prev) => ({...prev,[proposalId]: false }));
        }
    };


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
        setProposalStatus((prev) => ({
            ...prev,
            [proposalId]: "accepting"}));
        try {
            await writeContract({
                address: FactoryConfig.address,
                abi: FactoryConfig.abi,
                functionName: "acceptProposal",
                args: [proposalId],
                chainId: FactoryConfig.chainId,
            });
            alert("Please confirm the acceptance in your wallet.");
            
            await new Promise((resolve) => setTimeout(resolve, 15000));

            setProposalStatus((prev) => ({
                ...prev,
                [proposalId]: "funding"}));

            const proposal = openProposal.find((p) => Number(p.id) === Number(proposalId));

            setAcceptedProposal((prev) => [
                ...prev, proposal]);
            
            const deployedLoan = await readContract(config, {
                address: FactoryConfig.address,
                abi: FactoryConfig.abi,
                functionName: "getAddressforProposal",
                args: [proposalId],
            });

            console.log("Deployed Loan Address:", deployedLoan);
            
            await writeContract({
                address: deployedLoan,
                abi: ContractConfig.abi,
                functionName: "fundLoan",
                value: proposal.loanAmount,
                chainId: FactoryConfig.chainId,
            });

            alert("Please confirm the transaction in your wallet.");

            await new Promise((resolve) => setTimeout(resolve, 5000));
            setProposalStatus((prev) => ({
                ...prev,
                [proposalId]: "funded"}));

            setTimeout(() => {
                refetchProposals();
            }, 5000); // Refetch proposals after 5 seconds

        } catch (error) {
            console.error("Error accepting proposal:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const allDisplayProposals = [
        ...openProposal.filter(proposal => proposal.borrower.toLowerCase() !== address?.toLowerCase()), 
        ...acceptedProposal.filter(ap => 
            !openProposal.some(op => Number(op.id) === Number(ap.id)) && 
            ap.borrower.toLowerCase() !== address?.toLowerCase()
        )
    ];


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
                {!allDisplayProposals || allDisplayProposals.length === 0 ? (
                    <SoftTypography  mt = {2} textAlign = "center" variant = "body2">
                        No proposals found.
                    </SoftTypography>
                ):(
                    allDisplayProposals.map((proposal, index) => (
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

                                    <SoftButton
                                        variant="outlined" 
                                        color="primary" 
                                        onClick={() => getAIAnalysis(Number(proposal.id))}
                                        style={{ marginTop: "12px" }}
                                    >
                                        {aiLoading[Number(proposal.id)] ? "Thinking..." : "Get AI Analysis"}
                                    </SoftButton>

                                    {aiAnalysis[Number(proposal.id)] && (
                                        <SoftBox
                                            mt={2}
                                            p={2}
                                            border="1px dashed"
                                            borderColor="success.main"
                                            borderRadius="10px"
                                            backgroundColor="rgba(76, 175, 80, 0.1)"
                                            width="100%"
                                            maxWidth="800px"
                                            textAlign="left"
                                            maxHeight="200px" 
                                            overflow="auto" 
                                            sx={{
                                                '&::-webkit-scrollbar': {
                                                    width: '8px',
                                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    borderRadius: '4px',
                                                    backgroundColor: 'rgba(76, 175, 80, 0.3)',
                                                },

                                                wordsBreak: "break-word",
                                            }}
                                        >
                                            <SoftTypography variant="h6" fontWeight="bold" color="success.main" mb={1}>
                                                AI Analysis:
                                            </SoftTypography>
                                            <SoftBox sx={{                                                 '& h1, & h2, & h3, & h4, & h5, & h6': {
                                                    color: 'success.main',
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
                                                    {aiAnalysis[Number(proposal.id)]}
                                                </ReactMarkdown>
                                            </SoftBox>
                                        </SoftBox>
                                    )}

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