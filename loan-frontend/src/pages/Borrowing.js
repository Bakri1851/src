import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import SoftAlert from "components/SoftAlert"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContracts, useReadContract, useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from '@wagmi/core'
import { rateSwitchingABI } from "constants/RateSwitchingABI"

export default function Borrowing() {
    const { isConnected } = useAccount()
    const { writeContract, acceptPending, 
        takePending, repayPending} = useWriteContract();
    
    // ✅ Get the contract address and ABI
    const contractAddress = "0xD3689c177f303cEdfBAB7D68026dA5815F81A25A"
    const contractConfig = {
        address: contractAddress,
        abi: rateSwitchingABI,
        chainId: 11155111, // Sepolia
    }
    const stateLabel = {
        0:"Created",
        1:"Funded",
        2:"Accepted",
        3:"Taken",
        4:"Repaid",
        5:"Liquidated",
    }
    const { data: loanState, refetch: refetchState, isLoading:loadingState,} = useReadContract({...contractConfig, functionName: "getLoanState"})
    const {data: loanAmount} = useReadContract({...contractConfig, functionName: "getLoanAmount"});
    const {data: collateralAmount} = useReadContract({...contractConfig, functionName: "getEthCollateralAmount"});
    const {data: feeAmount} = useReadContract({...contractConfig, functionName: "feeAmount"});
    const {data: repayByTimestamp} = useReadContract({...contractConfig, functionName: "getRepayByTimestamp"});
    const {data: fixedRate} = useReadContract({...contractConfig, functionName: "getFixedRate"});
    const {data: floatingRate} = useReadContract({...contractConfig, functionName: "getFloatingRate"});
    const {data: interestToPay} = useReadContract({...contractConfig, functionName: "calculateInterest",});
    const  repaymentAmount = BigInt(loanAmount); // add interest to this

    const handleAcceptLoan = async () => {
        try {
            await writeContract({
                ...contractConfig,
                functionName: "acceptLoanTerms",
                value: collateralAmount,
            });
            alert("Successfully accepted the loan!");
        } catch (error) {
            console.error("Error accepting loan:", error);
            alert("Error accepting loan. Please try again.");
        }
    }


    const handleTakeLoan = async () => {
        try {
            await writeContract({
                ...contractConfig,
                functionName: "takeLoan",
            });
            alert("Successfully took the loan!");
        } catch (error) {
            console.error("Error taking loan:", error);
            alert("Error taking loan. Please try again.");
        }
    }

    const handleRepayLoan = async () => {
        try {
            await writeContract({
                ...contractConfig,
                functionName: "repay",
                value: loanAmount,
            });
            alert("Successfully repaid the loan!");
        } catch (error) {
            console.error("Error repaying loan:", error);
            alert("Error repaying loan. Please try again.");
        }
    }
    
    const formatRate = (rate) =>
        rate ? `${(Number(rate) / 100).toFixed(2)}%` : "Loading..."
    const formatTimestamp = (timestamp) =>
        timestamp ? new Date(Number(timestamp) * 1000).toLocaleString() : "Loading...";
    return (
        <SoftBox mt={5} mx = "auto" p={4} width="fit-content" backgroundColor="white" borderRadius="xl" boxShadow="lg">
        <SoftTypography variant = "h4" textAlign = "center">Borrower Dashboard</SoftTypography>
        {!isConnected && (
            <SoftTypography mt variant="body2">
                Please connect your wallet to access the borrower dashboard.
            </SoftTypography>
        )}
        {isConnected && (
            <>
            <SoftBox mt = "3" mb = "3" textAlign = "center" width = "100%" >
                <SoftTypography variant = "h6">Loan Terms</SoftTypography>
                <SoftTypography variant = "body2">Loan Amount: {loanAmount} ETH</SoftTypography>
                <SoftTypography variant = "body2">Collateral: {collateralAmount} ETH</SoftTypography>
                <SoftTypography variant = "body2">Fee Amount: {feeAmount} ETH</SoftTypography>
                <SoftTypography variant = "body2">Repay By: {formatTimestamp(repayByTimestamp)}</SoftTypography>
                <SoftTypography variant = "body2">Fixed Rate: {formatRate(fixedRate)}</SoftTypography>
                <SoftTypography variant = "body2">Floating Rate: {formatRate(floatingRate)}</SoftTypography>
            </SoftBox>
            <SoftBox mt = "3" mb = "3" textAlign = "center" width = "100%">
                <SoftTypography variant = "h6">What you pay: {repaymentAmount}</SoftTypography>
            </SoftBox>

        
        {!loanState == 1 &&(
        <SoftButton
        color = "info"
        onClick = {handleAcceptLoan}
        disabled={loadingState}
        mt = {2}
        sx={{width: "100%"}}
        variant = "gradient"
        gradient = {{
            from: "info",
            to: "success",
            deg: 45,
        }} >
            {acceptPending ? "Accepting..." : "Accept Loan Terms"}
        </SoftButton>
        )}
        {loanState == 2 && (
            <SoftButton
            color = "primary"
            onClick = {handleTakeLoan}
            disabled={loadingState}
            mt = {2}
            sx={{width: "100%"}}
            variant = "gradient"
            gradient = {{
                from: "info",
                to: "success",
                deg: 45,
            }} >
                {takePending ? "Taking..." : "Take Loan"}
            </SoftButton>
        )}

        {loanState == 3 && (
            <SoftButton
            color = "secondary"
            onClick = {handleRepayLoan}
            disabled={loadingState}
            mt = {2}
            sx={{width: "100%"}}
            variant = "gradient"
            gradient = {{
                from: "info",
                to: "success",
                deg: 45,
            }} >
                {repayPending ? "Repaying..." : "Repay Loan"}
            </SoftButton>
        )}

        </>
    )}
        </SoftBox>
    )
}