import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContracts, useReadContract, useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from '@wagmi/core'
import { rateSwitchingABI } from "constants/RateSwitchingABI"
import ContractConfig from "constants/ContractConfig"

export default function Lending() {
  const { isConnected } = useAccount()
  const { writeContract, fundPending,fundSuccess} = useWriteContract();

  //   Get the contract address and ABI
  const contractConfig = ContractConfig; 


  const formatRate = (rate) =>
    rate ? `${(Number(rate) / 100).toFixed(2)}%` : "Loading..."
  const formatTimestamp = (timestamp) =>
    timestamp ? new Date(Number(timestamp) * 1000).toLocaleString() : "Loading...";

  const { data: loanState, isLoading: loadingState} = useReadContract({...contractConfig, functionName: "getLoanState"});
  const {data: loanAmount} = useReadContract({...contractConfig, functionName: "getLoanAmount"});
  const {data: collateralAmount} = useReadContract({...contractConfig, functionName: "getEthCollateralAmount"});
  const {data: repayByTimestamp} = useReadContract({...contractConfig, functionName: "getRepayByTimestamp"});
  const {data: fixedRate} = useReadContract({...contractConfig, functionName: "getFixedRate"});
  const {data: floatingRate} = useReadContract({...contractConfig, functionName: "getFloatingRate"});



    const handleFundLoan = async () => {
        try {
            await writeContract({
                ...contractConfig,
                functionName: "fundLoan",
                value: loanAmount,
            });
            alert("Please confirm the transaction in your wallet.");
        } catch (error) {
            console.error("Error funding loan:", error);
            alert("Error funding loan. Please try again.");
        }
        };

    const handleLiquidateLoan = async () => {
        try {
            await writeContract({
                ...contractConfig,
                functionName: "liquidate",
            });
            alert("Please confirm the transaction in your wallet.");
        } catch (error) {
            console.error("Error liquidating loan:", error);
            alert("Error liquidating loan. Please try again.");
        }
    }
    const canLiquidate = async () => {
        const isTaken = (loanState == 3);
        const isExpired = repayByTimestamp && Number(repayByTimestamp) < Math.floor(Date.now() / 1000);

        return isTaken && isExpired;
    }

    return (
        <SoftBox mt={5} mx="auto" p={4} width="fit-content" backgroundColor="white" borderRadius="xl" boxShadow="lg">
            <SoftTypography variant = "h4" textAlign = "center">Lender Dashboard</SoftTypography>
            {!isConnected && (
                <SoftTypography mt variant="body2">
                    Please connect your wallet to access the lender dashboard.
                </SoftTypography>
            )}
            {isConnected && (
                <>
                <SoftBox mt = "3" mb = "3" textAlign = "center" width = "100%">
                    <SoftTypography variant = "h6">Loan Terms</SoftTypography>
                    <SoftTypography variant = "body2">Loan Amount: {loanAmount} ETH</SoftTypography>
                    <SoftTypography variant = "body2">Collateral: {collateralAmount} ETH</SoftTypography>
                    <SoftTypography variant = "body2">Fixed Rate: {formatRate(fixedRate)}</SoftTypography>
                    <SoftTypography variant = "body2">Floating Rate: {formatRate(floatingRate)}</SoftTypography>
                </SoftBox>

                <SoftTypography variant="body2">
                Repayment deadline:{" "}
                {repayByTimestamp
                    ? new Date(Number(repayByTimestamp) * 1000).toLocaleString()
                    : "Loading..."}
                </SoftTypography>

                {loanState == 0 &&(
                    <SoftButton
                    color = "info"
                    onClick = {handleFundLoan}
                    disabled={fundPending}
                    mt = {2}
                    sx={{width: "100%"}}
                    variant = "gradient"
                    gradient = {{
                        from: "info",
                        to: "success",
                        deg: 45,
                    }}
                    >
                        {fundPending ? "Funding..." : "Fund Loan"}
                    </SoftButton>
                    )}
                    {fundSuccess && (
                        <SoftTypography mt={2} color="success">
                            Loan funded successfully!
                        </SoftTypography>
                    )}

                {((loanState == 3)&&(repayByTimestamp && Number(repayByTimestamp) < Math.floor(Date.now() / 1000))) && (
                    <SoftButton
                    color = "error"
                    onClick = {handleLiquidateLoan}
                    disabled={loadingState}
                    mt = {2}
                    sx={{width: "100%"}}
                    variant = "gradient"
                    gradient = {{
                        from: "error",
                        to: "warning",
                        deg: 45,
                    }}
                    >
                        Liquidate Loan
                    </SoftButton>
                )}
                {loanState == 5 && (
                    <SoftTypography mt={2} color="warning">
                        Loan has been liquidated
                    </SoftTypography>
                )}
                        
                </>
            )}

        </SoftBox>
    )

  }
