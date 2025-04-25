import FactoryConfig from "constants/FactoryConfig";
import { useEffect, useState } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import SoftBox from "components/SoftBox";
import { useAccount } from "wagmi";
import { wagmiConfig } from "../wagmi.js";
import { readContract } from "@wagmi/core";
import ContractConfig from "constants/ContractConfig";
import useOpenAI from "hooks/useOpenAI.js";
import ReactMarkdown from "react-markdown";
import { formatEther, formatTimestamp, formatRate, shortenAddress } from "utils/formatters.js";
import RepaymentCountdown from "components/RepaymentCountdown";
import { Grid } from "@mui/material";
import { getProposalTags } from "utils/taggers.js";
import { Stack, Chip } from "@mui/material";

export default function ProposalExplorer() {
  const { address, isConnected } = useAccount();
  const [openProposal, setOpenProposal] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedProposals, setExpandedProposals] = useState({});

  const [aiAnalysis, setAiAnalysis] = useState({});
  const [aiLoading, setAiLoading] = useState({});

  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [proposalStatus, setProposalStatus] = useState({});
  const [acceptedProposal, setAcceptedProposal] = useState([]);

  const { writeContract } = useWriteContract();
  const config = wagmiConfig;

  const { data: proposals, refetch: refetchProposals } = useReadContract({
    address: FactoryConfig.address,
    abi: FactoryConfig.abi,
    functionName: "getAllOpenProposals",
    enabled: isConnected,
  });

  const { analyseProposal } = useOpenAI();

  const getAIAnalysis = async (proposalId) => {
    const proposal = allDisplayProposals.find((p) => Number(p.id) === Number(proposalId));
    if (!proposal) return;

    setAiLoading((prev) => ({ ...prev, [proposalId]: true }));

    try {
      const analysis = await analyseProposal({
        loanAmount: formatEther(proposal.loanAmount),
        feeAmount: formatEther(proposal.feeAmount),
        ethCollateralAmount: formatEther(proposal.ethCollateralAmount),
        repayByTimestamp: formatTimestamp(proposal.repayByTimestamp),
        fixedRate: formatRate(proposal.fixedRate),
        floatingRate: formatRate(proposal.floatingRate),
      });
      setAiAnalysis((prev) => ({ ...prev, [proposalId]: analysis }));
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
    } finally {
      setAiLoading((prev) => ({ ...prev, [proposalId]: false }));
    }
  };

  const selectProposalForAnalysis = (proposalId) => {
    setSelectedProposalId(proposalId);
    getAIAnalysis(proposalId);
  };

  useEffect(
    () => {
      setSelectedProposalId(null);
      setAiAnalysis({});
      setAiLoading({});
      setExpandedProposals({});

      if (proposals && proposals.length > 0) {
        setOpenProposal(proposals);
        setIsLoading(false);
      } else if (proposals && proposals.length === 0) {
        setOpenProposal([]);
        setIsLoading(false);
      }
    },
    [proposals],
    [address]
  );

  const toggleProposalDetails = (proposalId) => {
    setExpandedProposals((prev) => ({
      ...prev,
      [proposalId]: !prev[proposalId],
    }));
  };

  const handleAcceptProposal = async (proposalId) => {
    setIsLoading(true);
    setProposalStatus((prev) => ({
      ...prev,
      [proposalId]: "accepting",
    }));
    try {
      const proposal = openProposal.find((p) => Number(p.id) === Number(proposalId));
      const balance = BigInt(
        await window.ethereum.request({ method: "eth_getBalance", params: [address, "latest"] })
      );

      if (balance < proposal.loanAmount) {
        alert("Insufficient balance to accept this proposal.");
        return;
      }

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
        [proposalId]: "funding",
      }));

      setAcceptedProposal((prev) => [...prev, proposal]);

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
        [proposalId]: "funded",
      }));

      setTimeout(() => {
        refetchProposals();
      }, 5000); // Refetch proposals after 5 seconds
    } catch (error) {
      console.error("Error accepting proposal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    setExpandedProposals({});
    setSelectedProposalId(null);
    aiAnalysis[loanAddress];

    try {
      await refetch();
      setRefreshCounter((prev) => prev + 1); // Trigger re-filtering
    } catch (error) {
      console.error("Error refreshing loans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const allDisplayProposals = [
    ...openProposal.filter(
      (proposal) =>
        proposal.borrower.toLowerCase() !== address?.toLowerCase() &&
        Number(proposal.repayByTimestamp) > Math.floor(Date.now() / 1000)
    ),
    ...acceptedProposal.filter(
      (ap) =>
        !openProposal.some((op) => Number(op.id) === Number(ap.id)) &&
        ap.borrower.toLowerCase() !== address?.toLowerCase()
    ),
  ];

  return (
    <Grid
      container
      spacing={3}
      justifyContent="space-between"
      alignItems="flex-start"
      minHeight="100vh"
    >
      {/* Sidebar compensation */}
      <Grid
        item
        xs={0}
        sm={1}
        md={1}
        lg={1}
        xl={2}
        sx={{ display: { xs: "none", sm: "block" } }}
      ></Grid>

      {/*Proposal Explorer*/}
      <Grid
        item
        xs={12}
        sm={10}
        md={7}
        lg={6}
        xl={6}
        sx={{ display: "flex", justifyContent: "center" }}
      >
        <SoftBox
          mt={5}
          mx="auto"
          p={4}
          width="80%"
          maxWidth="600px"
          bgcolor="rgba(255,255,255,1)"
          borderRadius="lg"
          boxShadow="lg"
          display="flex"
          flexDirection="column"
          sx={{
            height: "calc(100vh - 120px)",
            position: "sticky",
            top: "80px",
            boxShadow: "0 20px 27px 0 rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(226, 232, 240, 0.6)",
          }}
        >
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

          {isConnected && (
            <SoftBox display="flex" justifyContent="center" mb={2}>
              <SoftButton
                variant="gradient"
                color="info"
                size="small"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Refresh Proposals"}
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
            <SoftBox
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                width: "100%",
                pr: 1,
              }}
            >
              {!allDisplayProposals || allDisplayProposals.length === 0 ? (
                <SoftTypography mt={2} textAlign="center" variant="body2">
                  No proposals found.
                </SoftTypography>
              ) : (
                allDisplayProposals.map((proposal, index) => (
                  <SoftBox
                    key={Number(proposal.id)}
                    mb={3}
                    p={2}
                    variant="gradient"
                    boxShadow="sm"
                    textAlign="centre"
                    sx={{
                      border: "2px solid",
                      borderRadius: "15px",
                      variant: "gradient",
                      border: "1px solid rgba(0, 0, 0, 0.6)",
                    }}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                  >
                    <SoftTypography variant="h6" fontWeight="bold" mb={1}>
                      Proposal ID: {Number(proposal.id)}
                    </SoftTypography>
                    <SoftTypography variant="body2" color="text" mb={1}>
                      Borrower: {shortenAddress(proposal.borrower)}
                    </SoftTypography>
                    <SoftTypography variant="body2" color="text" mb={1}>
                      Loan Amount: {formatEther(proposal.loanAmount)} ETH
                    </SoftTypography>

                    <Stack direction="row" spacing={1} justifyContent="center" mb={1} mt={1}>
                      {getProposalTags(proposal).map((tag, index) => (
                        <SoftBox
                          key={index}
                          px={1.5}
                          py={0.5}
                          borderRadius="md"
                          bgColor={`${tag.color}.main`}
                          color={tag.color}
                          fontSize="0.9rem"
                          fontWeight="bold"
                          sx={{ display: "inline-flex", textTransform: "uppercase" }}
                        >
                          {tag.label}
                        </SoftBox>
                      ))}
                    </Stack>
                    {expandedProposals[Number(proposal.id)] ? (
                      <>
                        <SoftTypography variant="body2" mt={1}>
                          Fee Amount: {formatEther(proposal.feeAmount)} ETH
                        </SoftTypography>
                        <SoftTypography variant="body2" mt={1}>
                          Collateral Amount: {formatEther(proposal.ethCollateralAmount)} ETH
                        </SoftTypography>
                        <SoftBox mt={1} width="100%">
                          <RepaymentCountdown
                            timestamp={proposal.repayByTimestamp}
                            creationTimestamp={proposal.creationTimestamp}
                            label="Proposed repayment deadline:"
                          />
                        </SoftBox>

                        <SoftTypography variant="body2" mt={1}>
                          Fixed Rate: {formatRate(proposal.fixedRate)}
                        </SoftTypography>
                        <SoftTypography variant="body2" mt={1}>
                          Floating Rate: {formatRate(proposal.floatingRate)}
                        </SoftTypography>

                        <SoftButton
                          variant="gradient"
                          color="info"
                          onClick={() => selectProposalForAnalysis(Number(proposal.id))}
                          style={{ marginTop: "12px" }}
                        >
                          {aiLoading[Number(proposal.id)] ? "Thinking..." : "Get AI Analysis"}
                        </SoftButton>

                        <SoftButton
                          variant="gradient"
                          color="info"
                          onClick={() => handleAcceptProposal(Number(proposal.id))}
                          style={{ marginTop: "12px" }}
                          disabled={isLoading}
                        >
                          Accept Proposal
                        </SoftButton>
                        <SoftButton
                          variant="gradient"
                          color="info"
                          onClick={() => toggleProposalDetails(Number(proposal.id))}
                          style={{ marginTop: "12px" }}
                        >
                          Hide Details
                        </SoftButton>
                      </>
                    ) : (
                      <SoftButton
                        variant="gradient"
                        color="info"
                        onClick={() => toggleProposalDetails(Number(proposal.id))}
                        style={{ marginTop: "12px" }}
                      >
                        Show Details
                      </SoftButton>
                    )}
                  </SoftBox>
                ))
              )}
            </SoftBox>
          )}
        </SoftBox>
      </Grid>

      {/* AI Help Section */}
      <Grid
        item
        xs={12}
        sm={12}
        md={6}
        lg={6}
        xl={4}
        sx={{ display: "flex", justifyContent: "center" }}
      >
        <SoftBox
          p={3}
          mt={5}
          borderRadius="xl"
          boxShadow="lg"
          backgroundColor="rgba(255,255,255,1)"
          borderColor="error.main"
          width="100%"
          maxWidth="800px"
          display="flex"
          flexDirection="column"
          sx={{
            height: "calc(100vh - 120px)",
            position: "sticky",
            top: "80px",
            boxShadow: "0 20px 27px 0 rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(226, 232, 240, 0.6)",
          }}
        >
          <SoftTypography variant="h5" mb={2}>
            Loan Assistant
          </SoftTypography>

          {/* AI content area with scrolling */}
          <SoftBox
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              mb: 2,
              pr: 1,
              width: "100%",
              maxWidth: "800px",
            }}
          >
            {selectedProposalId && aiAnalysis[selectedProposalId] ? (
              <SoftBox
                sx={{
                  wordBreak: "break-word",
                  "& h1, & h2, & h3, & h4, & h5, & h6": {
                    color: "info.main",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    mt: 1,
                    mb: 0.5,
                  },
                  "& ul, & ol": {
                    pl: 4,
                  },
                  "& li": {
                    display: "list-item",
                    marginLeft: 1,
                  },
                  "& p": {
                    mb: 1,
                  },
                  "& code": {
                    backgroundColor: "rgba(0,0,0,0.04)",
                    padding: "0.2em 0.4em",
                    borderRadius: "3px",
                    fontFamily: "monospace",
                  },
                }}
              >
                <ReactMarkdown>{aiAnalysis[selectedProposalId]}</ReactMarkdown>
              </SoftBox>
            ) : (
              <SoftTypography variant="body2" color="text.secondary" fontStyle="italic">
                Select a proposal and click `Get AI Analysis` to get AI insights on loan terms.
              </SoftTypography>
            )}
          </SoftBox>
        </SoftBox>
      </Grid>
    </Grid>
  );
}
