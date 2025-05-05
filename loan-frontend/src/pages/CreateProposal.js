import FactoryConfig from "constants/FactoryConfig";
import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useSoftUIController } from "context";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import SoftBox from "components/SoftBox";
import { useAccount } from "wagmi";
import { helpMakeProposal } from "api/openai";
import ReactMarkdown from "react-markdown";
import { parseEther } from "viem";
import { formatRate, interestCalculationTypeLabel } from "utils/formatters";
import Grid from "@mui/material/Grid";
import { ORACLE_ABI } from "constants/OracleABI.js";

export default function CreateProposal() {
  const [controller] = useSoftUIController();
  const direction = controller?.direction || "ltr";

  const [aiSuggestions, setAiSuggestions] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const { data: floatingRate, isLoading: isLoadingFloating } = useReadContract({
    address: FactoryConfig.address,
    abi: FactoryConfig.abi,
    functionName: "getCurrentFloatingRate",
    watch: true,
  });

  const { data: utilizationRate, isLoading: isLoadingUtilization } = useReadContract({
    address: FactoryConfig.address,
    abi: FactoryConfig.abi,
    functionName: "getUtilizationRate",
    watch: true,
  });

  const formattedFloatingRate = floatingRate ? formatRate(floatingRate) : "Loading...";
  const formattedUtilizationRate = isLoadingUtilization
    ? "Loading..."
    : utilizationRate !== undefined
    ? (Number(utilizationRate) / 100).toFixed(2) + "%"
    : "Error loading";

  const [form, setForm] = useState({
    loanAmount: "",
    feeAmount: "",
    collateral: "",
    repayBy: "",
    repayByDateString: "",
    fixedRate: "",
    floatingRate: "",
    oracle: "0x8e604308BD61d975bc6aE7903747785Db7dE97e2",
    interestCalculationType: "0",
  });

  const { isConnected } = useAccount();

  const { data: oracleData } = useReadContract({
    address: form.oracle,
    abi: ORACLE_ABI,
    functionName: "latestRoundData",
    enabled: isConnected,
  });

  useEffect(() => {
    if (floatingRate !== undefined) {
      try {
        const spread = 100;
        const fixedRate = Number(floatingRate) + spread;
        setForm((prevForm) => ({
          ...prevForm,
          fixedRate: fixedRate.toString(),
          floatingRate: floatingRate.toString(),
        }));
      } catch (error) {
        console.error("Error parsing oracle data:", error);
      }
    }
  }, [floatingRate]);

  const { writeContract, data: txHash, error: writeError } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    onSuccess: (receipt) => {
      console.log("Transaction receipt:", receipt);
    },
    onError: (error) => {
      console.error("Error waiting for transaction receipt:", error);
    },
  });

  const getAiHelp = async () => {
    setAiLoading(true);
    try {
      const suggestions = await helpMakeProposal({
        loanAmount: form.loanAmount,
        feeAmount: form.feeAmount,
        collateral: form.collateral,
        repayByDateString: form.repayByDateString,
        fixedRate: formatRate(form.fixedRate),
        floatingRate: formatRate(form.floatingRate),
      });
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("Error getting AI help:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const dateString = e.target.value;
    const selectedDate = new Date(dateString);

    const minValidTime = new Date();
    minValidTime.setHours(minValidTime.getHours() + 0); //change the 0 to 1

    if (selectedDate < minValidTime) {
      alert("Repayment date must be at least 1 hour in the future");

      const minValidDateString = minValidTime.toISOString().slice(0, 16);
      const minValidTimestamp = Math.floor(minValidTime.getTime() / 1000);

      setForm((prevForm) => ({
        ...prevForm,
        repayBy: minValidTimestamp.toString(),
        repayByDateString: minValidDateString,
      }));
    } else {
      const timestamp = Math.floor(selectedDate.getTime() / 1000);
      setForm((prevForm) => ({
        ...prevForm,
        repayBy: timestamp.toString(),
        repayByDateString: dateString,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted:", form);

    if (!form.loanAmount || !form.feeAmount || !form.collateral || !form.repayBy) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const loanAmount = parseEther(form.loanAmount);
      const feeAmount = parseEther(form.feeAmount);
      const collateral = parseEther(form.collateral);
      const repayBy = form.repayBy;
      const contract = FactoryConfig.contract;

      await writeContract({
        address: FactoryConfig.address,
        abi: FactoryConfig.abi,
        functionName: "createProposal",
        args: [
          loanAmount,
          feeAmount,
          collateral,
          repayBy,
          BigInt(form.fixedRate),
          BigInt(form.floatingRate),
          form.oracle,
          form.interestCalculationType,
        ],
        chainId: FactoryConfig.chainId,
      });

      alert("Please confirm the transaction in your wallet.");
    } catch (error) {
      console.error("Error sending transaction:", error);
    }
  };

  const handleEthAmountChange = (e) => {
    const { name, value } = e.target;

    const amount = parseFloat(value);

    // Get current values for ratio calculations
    const currentLoanAmount = name === "loanAmount" ? amount : parseFloat(form.loanAmount) || 0;
    const currentCollateral = name === "collateral" ? amount : parseFloat(form.collateral) || 0;
    const currentFee = name === "feeAmount" ? amount : parseFloat(form.feeAmount) || 0;

    const MIN_LOAN_AMOUNT = 0.05; // Minimum loan of 0.05 ETH 0.05
    const MAX_LOAN_AMOUNT = 100; // Maximum loan of 100 ETH
    const MIN_COLLATERAL_RATIO = 1.5; // Collateral must be at least 150% of loan 1.5
    const MAX_FEE_PERCENTAGE = 0.2; // Fee can't exceed 20% of loan amount 0.1

    let errorMessage = "";
    let finalValue = value;

    // Apply validation based on field name
    if (name === "loanAmount") {
      if (amount < MIN_LOAN_AMOUNT) {
        errorMessage = `Loan amount must be at least ${MIN_LOAN_AMOUNT} ETH`;
        finalValue = MIN_LOAN_AMOUNT.toString();
      } else if (amount > MAX_LOAN_AMOUNT) {
        errorMessage = `Loan amount cannot exceed ${MAX_LOAN_AMOUNT} ETH`;
        finalValue = MAX_LOAN_AMOUNT.toString();
      }

      // Check if fee exceeds the maximum percentage
      if (currentFee > amount * MAX_FEE_PERCENTAGE) {
        errorMessage = `Fee amount exceeds ${MAX_FEE_PERCENTAGE * 100}% of loan amount`;
      }
    } else if (name === "collateral") {
      const minCollateral = currentLoanAmount * MIN_COLLATERAL_RATIO;
      if (currentLoanAmount > 0 && amount < minCollateral) {
        errorMessage = `Collateral must be at least ${
          MIN_COLLATERAL_RATIO * 100
        }% of loan amount (${minCollateral.toFixed(2)} ETH)`;
        finalValue = minCollateral.toFixed(2);
      }
    } else if (name === "feeAmount") {
      const maxFee = currentLoanAmount * MAX_FEE_PERCENTAGE;
      if (currentLoanAmount > 0 && amount > maxFee) {
        errorMessage = `Fee cannot exceed ${
          MAX_FEE_PERCENTAGE * 100
        }% of loan amount (${maxFee.toFixed(2)} ETH)`;
        finalValue = maxFee.toFixed(2);
      }
    }

    // Show error message if any
    if (errorMessage) {
      alert(errorMessage);
    }

    // Update form
    setForm((prevForm) => ({
      ...prevForm,
      [name]: finalValue,
    }));
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

      {/* Proposal Form */}
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
          mt={2}
          mx="auto"
          p={4}
          width="100%"
          maxWidth="600px"
          backgroundColor="rgba(255,255,255,1)"
          borderRadius="lg"
          boxShadow="md"
          sx={{
            boxShadow: "0 20px 27px 0 rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(226, 232, 240, 0.6)",
          }}
        >
          <SoftTypography variant="h4" fontWeight="bold" mb={2} textAlign="center">
            Create Proposal
          </SoftTypography>
          <SoftBox mb={2}>
            <SoftTypography variant="button" fontWeight="regular">
              Interest Calculation Type:
            </SoftTypography>
            <select
              className="form-control"
              name="interestCalculationType"
              value={form.interestCalculationType}
              onChange={(e) => setForm({ ...form, interestCalculationType: e.target.value })}
            >
              <option value="0">Simple Interest (APR)</option>
              <option value="1">Compound Interest (APY)</option>
            </select>
            <SoftTypography variant="caption" color="text" fontStyle="italic" mt={1}>
              Simple APR applies interest linearly, while Compound APY compounds interest daily
            </SoftTypography>
          </SoftBox>

          {!isConnected ? (
            <SoftBox textAlign="center">
              <SoftTypography mb={2} textAlign="center">
                Please connect your wallet to create a proposal.
              </SoftTypography>
            </SoftBox>
          ) : (
            <form onSubmit={handleSubmit}>
              <SoftBox mb={2}>
                <SoftTypography variant="button" fontWeight="regular">
                  Loan Amount (ETH)
                </SoftTypography>
                <SoftInput
                  type="number"
                  name="loanAmount"
                  placeholder="1.0"
                  value={form.loanAmount}
                  onChange={handleEthAmountChange}
                  required
                  step="0.01"
                  icon={{
                    component: (
                      <SoftTypography variant="button" fontWeight="regular"></SoftTypography>
                    ),
                    direction: direction === "rtl" ? "right" : "right",
                  }}
                />
              </SoftBox>
              <SoftBox mb={2}>
                <SoftTypography variant="button" fontWeight="regular">
                  Fee Amount (ETH)
                </SoftTypography>
                <SoftInput
                  type="number"
                  name="feeAmount"
                  placeholder="0.1"
                  value={form.feeAmount}
                  onChange={handleEthAmountChange}
                  required
                  step="0.01"
                  icon={{
                    component: (
                      <SoftTypography variant="button" fontWeight="regular"></SoftTypography>
                    ),
                    direction: direction === "rtl" ? "right" : "right",
                  }}
                />
              </SoftBox>
              <SoftBox mb={2}>
                <SoftTypography variant="button" fontWeight="regular">
                  Collateral (ETH)
                </SoftTypography>
                <SoftInput
                  type="number"
                  name="collateral"
                  placeholder="1.5"
                  value={form.collateral}
                  onChange={handleEthAmountChange}
                  required
                  step="0.01"
                  icon={{
                    component: (
                      <SoftTypography variant="button" fontWeight="regular"></SoftTypography>
                    ),
                    direction: direction === "rtl" ? "right" : "right",
                  }}
                />
              </SoftBox>
              <SoftBox mb={2}>
                <SoftTypography variant="button" fontWeight="regular">
                  Repay By
                </SoftTypography>
                <SoftInput
                  type="datetime-local"
                  name="repayBy"
                  value={form.repayByDateString} // Use the date string here
                  onChange={handleDateChange}
                  required
                  icon={{
                    component: <SoftTypography fontWeight="regular"></SoftTypography>,
                    direction: direction === "rtl" ? "right" : "right",
                  }}
                />
              </SoftBox>
              <SoftBox mb={2}>
                <SoftTypography variant="button" fontWeight="regular">
                  Fixed Rate (%)
                </SoftTypography>
                <SoftTypography variant="body2">{formatRate(form.fixedRate)}</SoftTypography>
              </SoftBox>
              <SoftBox mb={2}>
                <SoftTypography variant="button" fontWeight="regular">
                  Floating Rate (%)
                </SoftTypography>
                <SoftTypography variant="body2">{formattedFloatingRate}</SoftTypography>
              </SoftBox>
              <SoftBox mb={2}>
                <SoftTypography variant="button" fontWeight="regular">
                  Current Utilization (%)
                </SoftTypography>
                <SoftTypography variant="body2">{formattedUtilizationRate}</SoftTypography>
                <SoftTypography variant="caption" color="text" fontStyle="italic">
                  Higher utilization leads to higher rates
                </SoftTypography>
              </SoftBox>

              <SoftBox mb={2}>
                <SoftButton
                  type="submit"
                  variant="gradient"
                  color="info"
                  fullWidth
                  disabled={isWaiting || !form.fixedRate}
                  onClick={handleSubmit}
                  gradient={{
                    from: "info",
                    to: "success",
                    deg: 45,
                  }}
                >
                  {isWaiting ? "Creating..." : "Create Proposal"}
                </SoftButton>
              </SoftBox>
            </form>
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
          borderRadius="lg"
          backgroundColor="rgba(255,255,255,1)"
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
            {aiSuggestions ? (
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
                <ReactMarkdown>{aiSuggestions}</ReactMarkdown>
              </SoftBox>
            ) : (
              <SoftTypography variant="body2" color="text.secondary" fontStyle="italic">
                Get AI suggestions on your current terms to help optimize your loan proposal. If not
                sure what a field is leave it blank and the AI will talk to you about it.
              </SoftTypography>
            )}
          </SoftBox>

          {/* Button at bottom */}
          <SoftBox>
            <SoftButton
              variant="gradient"
              color="info"
              fullWidth
              disabled={aiLoading}
              onClick={getAiHelp}
            >
              {aiLoading ? "Thinking..." : "Get AI Suggestions"}
            </SoftButton>
          </SoftBox>
        </SoftBox>
      </Grid>
    </Grid>
  );
}
