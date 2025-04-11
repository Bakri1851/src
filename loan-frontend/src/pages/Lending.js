import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContracts, useReadContract, useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from '@wagmi/core'
import { rateSwitchingABI } from "constants/RateSwitchingABI"


export default function Lending() {
  const { isConnected } = useAccount()
  const { writeContract, fundPending,fundSuccess} = useWriteContract();

  // ✅ Get the contract address and ABI
  const contractAddress = "0xD3689c177f303cEdfBAB7D68026dA5815F81A25A"
  const contractConfig = {
    address: contractAddress,
    abi: rateSwitchingABI,
    chainId: 11155111, // Sepolia
  };
  const formatRate = (rate) =>
    rate ? `${(Number(rate) / 100).toFixed(2)}%` : "Loading..."
  const formatTimestamp = (timestamp) =>
    timestamp ? new Date(Number(timestamp) * 1000).toLocaleString() : "Loading...";

  const { data: loanState} = useReadContract({...contractConfig, functionName: "getLoanState"});
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
            alert("Successfully funded the loan!");
        } catch (error) {
            console.error("Error funding loan:", error);
            alert("Error funding loan. Please try again.");
        }
        };

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
                    <SoftTypography variant = "body2">Repay By: {formatTimestamp(repayByTimestamp)}</SoftTypography>
                    <SoftTypography variant = "body2">Fixed Rate: {formatRate(fixedRate)}</SoftTypography>
                    <SoftTypography variant = "body2">Floating Rate: {formatRate(floatingRate)}</SoftTypography>
                </SoftBox>
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
                        
                </>
            )}

        </SoftBox>
    )

  }
