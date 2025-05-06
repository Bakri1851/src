import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { readContract } from "wagmi/actions";
import ContractConfig from "constants/ContractConfig";
import FactoryConfig from "constants/FactoryConfig";
import { useEffect, useState } from "react";
import { wagmiConfig } from "../wagmi.js";
import useOpenAI from "hooks/useOpenAI.js";
import ReactMarkdown from "react-markdown";
import {
  formatEther,
  formatTimestamp,
  formatState,
  formatRate,
  rateTypeLabel,
  interestCalculationTypeLabel,
} from "utils/formatters.js";
import RepaymentCountdown from "components/RepaymentCountdown";
import Grid from "@mui/material/Grid";

export default function MyBorrowedLoans() {
  const { address, isConnected } = useAccount();
  const [userLoans, setUserLoans] = useState([]);
  const [loanDetails, setLoanDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLoans, setExpandedLoans] = useState({});
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState({});
  const [aiLoading, setAiLoading] = useState(false);

  const { analyseLoanTerms } = useOpenAI();

  const { writeContract } = useWriteContract();
  const config = wagmiConfig;

  const { data: borrowerLoans, refetch } = useReadContract({
    address: FactoryConfig.address,
    abi: FactoryConfig.abi,
    functionName: "getLoansByBorrower",
    args: [address],
    enabled: !!address,
  });

  const getAIAnalysis = async (loanAddress) => {
    if (aiAnalysis[loanAddress]) return;

    setAiLoading((prev) => ({ ...prev, [loanAddress]: true }));

    try {
      const analysis = await analyseLoanTerms({
        repaymentAmount: formatEther(
          loanDetails[loanAddress].loanAmount +
            loanDetails[loanAddress].interest +
            loanDetails[loanAddress].feeAmount
        ),
        loanAmount: formatEther(loanDetails[loanAddress].loanAmount),
        collateral: formatEther(loanDetails[loanAddress].collateralAmount),
        fixedRate: formatRate(loanDetails[loanAddress].fixedRate),
        floatingRate: formatRate(loanDetails[loanAddress].floatingRate),
        repayByTimestamp: formatTimestamp(loanDetails[loanAddress].repayByTimestamp),
        state: formatState(loanDetails[loanAddress].state),
        rateType: rateTypeLabel[loanDetails[loanAddress].rateType],
        interestCalculationType:
          interestCalculationTypeLabel[loanDetails[loanAddress].interestCalculationType],
      });
      setAiAnalysis((prev) => ({ ...prev, [loanAddress]: analysis }));
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
  }, [borrowerLoans, address, refreshCounter]);

  const fetchLoanDetails = async (loanAddress) => {
    setIsLoading(true);
    try {
      const borrower = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "borrower",
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

      const collateralAmount = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "getEthCollateralAmount",
        chainId: FactoryConfig.chainId,
      });

      const rateType = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "currentRateType",
        chainId: FactoryConfig.chainId,
      });

      const feeAmount = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "getFeeAmount",
        chainId: FactoryConfig.chainId,
      });

      const interest = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "getInterest",
        chainId: FactoryConfig.chainId,
      });

      const interestCalculationType = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "interestCalculationType",
        chainId: FactoryConfig.chainId,
      });

      setLoanDetails((prev) => ({
        ...prev,
        [loanAddress]: {
          borrower,
          loanAmount,
          state,
          collateralAmount,
          repayByTimestamp,
          fixedRate,
          floatingRate,
          rateType,
          interest,
          feeAmount,
          interestCalculationType,
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

  const handleAcceptLoan = async (loanAddress) => {
    try {
      const balance = BigInt(
        await window.ethereum.request({ method: "eth_getBalance", params: [address, "latest"] })
      );

      const collateralAmount = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "getEthCollateralAmount",
        chainId: FactoryConfig.chainId,
      });

      if (balance < collateralAmount) {
        alert("Insufficient balance to accept loan terms. Please fund your wallet and try again.");
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
  };

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
  };

  const handleRepayLoan = async (loanAddress) => {
    try {
      const balance = BigInt(
        await window.ethereum.request({ method: "eth_getBalance", params: [address, "latest"] })
      );

      await writeContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        functionName: "calculateInterest",
        chainId: FactoryConfig.chainId,
      });

      const interest = await readContract(config, {
        address: loanAddress,
        abi: ContractConfig.abi,
        chainId: FactoryConfig.chainId,
        functionName: "getInterest",
      });

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

      const totalRepayment = BigInt(loanAmount) + BigInt(interest) + BigInt(fee);

      if (balance < totalRepayment) {
        alert("Insufficient balance to repay loan. Please fund your wallet and try again.");
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
  };

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
      alert("Error switching rate. Please try again.");
    }
  };

  const selectLoanForAnalysis = (loanAddress) => {
    setSelectedLoanId(loanAddress);
    getAIAnalysis(loanAddress);
  };

  useEffect(() => {
    setSelectedLoanId(null);
    setAiAnalysis({});
    setAiLoading({});
    setExpandedLoans({});
  }, [address]);

  return (
    <Grid
      container
      spacing={3}
      justifyContent="space-between"
      alignItems="flex-start"
      minHeight="100vh"
    >
      {/* Sidebar compensation*/}
      <Grid
        item
        xs={0}
        sm={1}
        md={1}
        lg={1}
        xl={2}
        sx={{ display: { xs: "none", sm: "block" } }}
      ></Grid>

      {/* Loans listing column*/}
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
            Loans You Borrowed
          </SoftTypography>

          {/* Connection button */}
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

          {/* Refresh button */}
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

          {/* Loading state */}
          {isConnected && isLoading && (
            <SoftBox textAlign="center" mt={2}>
              <SoftTypography variant="body2" color="text" mb={1}>
                Loading loans...
              </SoftTypography>
            </SoftBox>
          )}

          {/* Loans list - make it scrollable */}
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

                    {/* Loan details when expanded */}
                    {loanDetails[loanAddress] && expandedLoans[loanAddress] ? (
                      <>
                        <SoftTypography variant="body2" mt={1}>
                          Repayment Amount:{" "}
                          {formatEther(
                            loanDetails[loanAddress].loanAmount +
                              loanDetails[loanAddress].interest +
                              loanDetails[loanAddress].feeAmount
                          )}{" "}
                          ETH
                        </SoftTypography>

                        <SoftTypography variant="body2" mt={1}>
                          Loan Amount: {formatEther(loanDetails[loanAddress].loanAmount)} ETH
                        </SoftTypography>

                        <SoftTypography variant="body2" mt={1}>
                          Collateral: {formatEther(loanDetails[loanAddress].collateralAmount)} ETH
                        </SoftTypography>

                        <SoftBox mt={1} width="100%">
                          <RepaymentCountdown
                            timestamp={loanDetails[loanAddress].repayByTimestamp}
                            creationTimestamp={loanDetails[loanAddress].creationTimestamp}
                            label="Time remaining to repay:"
                          />
                        </SoftBox>

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
                          Interest Type:{" "}
                          {interestCalculationTypeLabel[
                            loanDetails[loanAddress].interestCalculationType
                          ] || "Unknown"}
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

                        {loanDetails[loanAddress].state > 1 && (
                          <SoftButton
                            variant="gradient"
                            color="info"
                            onClick={() => handleSwitchRate(loanAddress)}
                            style={{ marginTop: "12px" }}
                          >
                            Switch Rate
                          </SoftButton>
                        )}

                        {/* Add Get AI Analysis button */}
                        <SoftButton
                          variant="gradient"
                          color="info"
                          onClick={() => selectLoanForAnalysis(loanAddress)}
                          style={{ marginTop: "12px" }}
                        >
                          {aiLoading[loanAddress] ? "Thinking..." : "Get AI Analysis"}
                        </SoftButton>

                        {/* Hide Details button */}
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
