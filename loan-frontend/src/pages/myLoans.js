import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { readContract } from "wagmi/actions";
import ContractConfig from "constants/ContractConfig";
import FactoryConfig from "constants/FactoryConfig";
import { useEffect, useState } from "react";
import { wagmiConfig } from "../wagmi.js";
import useOpenAI from "../hooks/useOpenAI.js";
import ReactMarkdown from "react-markdown";
import { formatRate, formatState, formatTimestamp, formatEther } from "../utils/formatters.js";
import RepaymentCountdown from "components/RepaymentCountdown";
import Grid from "@mui/material/Grid";

export default function MyLoans() {
  const { address, isConnected } = useAccount();
  const [userLoans, setUserLoans] = useState([]);
  const [loanDetails, setLoanDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLoans, setExpandedLoans] = useState({});
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [aiAnalysis, setAiAnalysis] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const config = wagmiConfig;
  const { writeContract } = useWriteContract();

  const { analyseLoanTerms } = useOpenAI();

  const { data: lenderLoans, refetch } = useReadContract({
    address: FactoryConfig.address,
    abi: FactoryConfig.abi,
    functionName: "getLoansByLender",
    args: [address],
    enabled: !!address,
  });

  const getAIAnalysis = async (loanAddress) => {
    if (aiAnalysis[loanAddress]) {
      setSelectedLoanId(loanAddress);
      return;
    }
    setAiLoading((prev) => ({ ...prev, [loanAddress]: true }));
    try {
      const analysis = await analyseLoanTerms({
        loanAmount: formatEther(loanDetails[loanAddress].loanAmount),
        fixedRate: formatRate(loanDetails[loanAddress].fixedRate),
        floatingRate: formatRate(loanDetails[loanAddress].floatingRate),
        repayByTimestamp: formatTimestamp(loanDetails[loanAddress].repayByTimestamp),
        state: formatState(loanDetails[loanAddress].state),
      });
      setAiAnalysis((prev) => ({ ...prev, [loanAddress]: analysis }));
      setSelectedLoanId(loanAddress);
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
    } finally {
      setAiLoading((prev) => ({ ...prev, [loanAddress]: false }));
    }
  };

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
          chainId: FactoryConfig.chainId,
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
      } else if (stateA >= 1 && stateA <= 3) return -1;
      else if (stateB >= 1 && stateB <= 3) return 1;
      else return stateB - stateA;
    });
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setLoanDetails({});
    setExpandedLoans({});
    setSelectedLoanId(null);

    try {
      await refetch();
      setRefreshCounter((prev) => prev + 1);
    } catch (error) {
      console.error("Error refreshing loans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedLoanId(null);
    setAiAnalysis({});
    setAiLoading({});
    setExpandedLoans({});
    setLoanDetails({});
  }, [address]);

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
      const lender = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "lender",
        chainId: FactoryConfig.chainId,
      });

      const loanAmount = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "getLoanAmount",
        chainId: FactoryConfig.chainId,
      });

      const state = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "getLoanState",
        chainId: FactoryConfig.chainId,
      });

      const repayByTimestamp = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "getRepayByTimestamp",
        chainId: FactoryConfig.chainId,
      });

      const fixedRate = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "getFixedRate",
        chainId: FactoryConfig.chainId,
      });

      const floatingRate = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "getFloatingRate",
        chainId: FactoryConfig.chainId,
      });

      setLoanDetails((prev) => ({
        ...prev,
        [loanAddress]: {
          lender,
          loanAmount,
          state,
          repayByTimestamp,
          fixedRate,
          floatingRate,
        },
      }));

      setExpandedLoans((prev) => ({
        ...prev,
        [loanAddress]: true,
      }));
    } catch (error) {
      console.error("Error fetching loan details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoanDetails = (loanAddress) => {
    if (expandedLoans[loanAddress]) {
      setExpandedLoans((prev) => ({
        ...prev,
        [loanAddress]: false,
      }));
    } else {
      if (loanDetails[loanAddress]) {
        setExpandedLoans((prev) => ({
          ...prev,
          [loanAddress]: true,
        }));
      } else {
        fetchLoanDetails(loanAddress);
      }
    }
  };

  const handleFundLoan = async (loanAddress) => {
    try {
      const balance = BigInt(
        await window.ethereum.request({ method: "eth_getBalance", params: [address, "latest"] })
      );

      const loanAmount = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "getLoanAmount",
        chainId: FactoryConfig.chainId,
      });
      if (balance < loanAmount) {
        alert("Insufficient balance to fund the loan.");
        return;
      }

      await writeContract({
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "fundLoan",
        chainId: FactoryConfig.chainId,
        value: loanAmount,
      });
      alert("Please confirm the transaction in your wallet.");
    } catch (error) {
      console.error("Error funding loan:", error);
      alert("Error funding loan. Please try again.");
    }
  };
  const handleLiquidateLoan = async (loanAddress) => {
    try {
      await writeContract({
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "liquidate",
        chainId: FactoryConfig.chainId,
      });
      alert("Please confirm the transaction in your wallet.");
    } catch (error) {
      console.error("Error liquidating loan:", error);
      alert("Error liquidating loan. Please try again.");
    }
  };

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

      {/* Loans listing column */}
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
            Loans You Funded
          </SoftTypography>

          {!isConnected && (
            <SoftBox textAlign="center" mt={2}>
              <SoftTypography variant="body2" color="text" mb={1}>
                Please connect your wallet to view your loans.
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
                {isLoading ? "Loading..." : "Refresh Loans"}
              </SoftButton>
            </SoftBox>
          )}

          {isConnected && isLoading && (
            <SoftBox textAlign="center" mt={2}>
              <SoftTypography variant="body2" color="text" mb={1}>
                Loading loans...
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
              {!userLoans || userLoans.length === 0 ? (
                <SoftTypography mt={2} textAlign="center" variant="body2">
                  No loans found.
                </SoftTypography>
              ) : (
                userLoans.map((loanAddress, index) => (
                  <SoftBox
                    key={index}
                    mb={3}
                    p={2}
                    variant="gradient"
                    boxShadow="sm"
                    textAlign="center"
                    sx={{
                      border: "1px solid rgba(0, 0, 0, 0.6)",
                      borderRadius: "15px",
                    }}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                  >
                    <SoftTypography variant="h6" fontWeight="bold" mb={1}>
                      Loan Address:
                    </SoftTypography>
                    <SoftTypography variant="body2" mb={2} style={{ wordBreak: "break-all" }}>
                      {loanAddress}
                    </SoftTypography>

                    {loanDetails[loanAddress] && expandedLoans[loanAddress] ? (
                      <>
                        <SoftTypography variant="body2" mt={1}>
                          Loan Amount: {formatEther(loanDetails[loanAddress].loanAmount)} ETH
                        </SoftTypography>

                        <SoftBox mt={1} width="100%">
                          <RepaymentCountdown
                            timestamp={loanDetails[loanAddress].repayByTimestamp}
                            creationTimestamp={loanDetails[loanAddress].creationTimestamp}
                            label="Borrower must repay within:"
                          />
                        </SoftBox>

                        <SoftTypography variant="body2" mt={1}>
                          Fixed Rate: {formatRate(loanDetails[loanAddress].fixedRate)}
                        </SoftTypography>

                        <SoftTypography variant="body2" mt={1}>
                          Floating Rate: {formatRate(loanDetails[loanAddress].floatingRate)}
                        </SoftTypography>

                        <SoftTypography variant="body2" mt={1}>
                          Status: {formatState(loanDetails[loanAddress].state)}
                        </SoftTypography>

                        {loanDetails[loanAddress].state == 0 && (
                          <SoftButton
                            variant="gradient"
                            color="info"
                            onClick={() => handleFundLoan(loanAddress)}
                            style={{ marginTop: "12px" }}
                          >
                            Fund Loan
                          </SoftButton>
                        )}

                        {loanDetails[loanAddress].state == 3 &&
                          loanDetails[loanAddress].repayByTimestamp &&
                          Number(loanDetails[loanAddress].repayByTimestamp) <
                            Math.floor(Date.now() / 1000) && (
                            <SoftButton
                              variant="gradient"
                              color="info"
                              onClick={() => handleLiquidateLoan(loanAddress)}
                              style={{ marginTop: "12px" }}
                            >
                              Liquidate Loan
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
            {selectedLoanId && aiAnalysis[selectedLoanId] ? (
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
                <ReactMarkdown>{aiAnalysis[selectedLoanId]}</ReactMarkdown>
              </SoftBox>
            ) : (
              <SoftTypography variant="body2" color="text.secondary" fontStyle="italic">
                Select a loan and click `Get AI Analysis` to get AI insights on loan terms.
              </SoftTypography>
            )}
          </SoftBox>
        </SoftBox>
      </Grid>
    </Grid>
  );
}
