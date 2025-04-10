import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContracts, useReadContract, useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from '@wagmi/core'
import { rateSwitchingABI } from "constants/RateSwitchingABI"

export default function Dashboard() {
  const { isConnected } = useAccount()
  const { writeContract, switchPending, switchSuccess, 
    refreshPending, refreshSuccess
  } = useWriteContract();




  // ✅ Get the contract address and ABI
  const contractAddress = "0xD3689c177f303cEdfBAB7D68026dA5815F81A25A"
  const contractConfig = {
    address: contractAddress,
    abi: rateSwitchingABI,
    chainId: 11155111, // Sepolia
  }

  const { data: loanState, refetch: refetchState, isLoading:loadingState,} = useReadContract({
    ...contractConfig,
    functionName: "getLoanState",
  })
  
  const {data : rawLoanAmount} = useReadContract({
    ...contractConfig,
    functionName: "getLoanAmount",
  })
  const {data: rawCollateralAmount} = useReadContract({
    ...contractConfig,
    functionName: "getEthCollateralAmount",
  })

  const {data: repayByTimestamp} = useReadContract({
    ...contractConfig,
    functionName: "getRepayByTimestamp",})


  // coverts the raw amount to string
  const loanAmount = rawLoanAmount ? Number(rawLoanAmount) / 1e18 : "Loading..."
  const collateralAmount = rawCollateralAmount ? Number(rawCollateralAmount) / 1e18 : "Loading..."
  const stateLabel = {
    0:"Created",
    1:"Funded",
    2:"Accepted",
    3:"Taken",
    4:"Repaid",
    5:"Liquidated",
  }


  // ✅ Read the current fixed rate
  const { data: fixedRate } = useReadContract({
    address: contractAddress,
    abi: rateSwitchingABI,
    chainId: 11155111,
    functionName: "getFixedRate",
  })

  // ✅ Read the current floating rate
  const { data: floatingRate,
    refetch: refetchFloatingRate,
    isLoading: loadingFloatingRate,
   } = useReadContract({
    address: contractAddress,
    abi: rateSwitchingABI,
    chainId: 11155111,
    functionName: "getFloatingRate",
  })
  

  // ✅ Read the current rate type
  const {
    data: rateType,
    refetch: refetchRateType,
    isLoading: loadingRate,
  } = useReadContract({
    ...contractConfig,
    functionName: "currentRateType",
  })

  const rateTypeLabel = {
    0: "Fixed",
    1: "Floating",
  }

  // ✅ Handle switch & update UI only after confirmation
  const handleSwitchRate = async () => {
    try {
      const hash = await writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'switchRateType',
        chainId: contractConfig.chainId,
      });
      console.log("Transaction submitted with hash:", hash.hash);

      await waitForTransactionReceipt({
        hash: hash.hash,
        chainId: contractConfig.chainId 
      });

      // Refetch the current rate type
      await refetchRateType();
    } catch (error) {
      console.error('Switch rate failed:', error);
    }
  }


  
  const handleRefreshRate = async () => {
  
    try {
      const hash = await writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: "updateRates",
        chainId: contractConfig.chainId,
      });
      
      console.log("Transaction submitted with hash:", hash);
      

    } catch (err) {
      console.error("Failed to refresh floating rate:", err);
      alert(`Failed to update rate: ${err.message || "Unknown error"}`);
    } finally {
      await refetchFloatingRate();
    }
  };

  const formatRate = (rate) =>
    rate ? `${(Number(rate) / 100).toFixed(2)}%` : "Loading..."
  

  return (
    <SoftBox
      p={3}
      mt={5}
      mx="auto"
      width="fit-content"
      borderRadius="xl"
      boxShadow="lg"
      backgroundColor="white"
    >
      <SoftTypography variant="h4">Welcome to the Loan Dashboard</SoftTypography>

      {!isConnected && (
        <SoftTypography variant="body2" mt={1}>
          Please connect your wallet to continue
        </SoftTypography>
      )}

      <SoftBox mt={3}>
        <ConnectButton />
      </SoftBox>

      {isConnected && (
        <>
          {/* Interest Rate Display */}
          <SoftBox
            p={3}
            mt={3}
            borderRadius="lg"
            boxShadow="md"
            backgroundColor="white"
          >
            <SoftTypography variant="h6">Current Interest Rate</SoftTypography>
            <SoftTypography variant="body1" color="dark">
              {loadingRate
                ? "Loading..."
                : rateTypeLabel[rateType] || "Unknown"}
            </SoftTypography>

            <SoftTypography variant="h6">Loan Terms</SoftTypography>
            <SoftTypography variant="body2">
              Loan Amount: {loanAmount ? `${Number(loanAmount) / 1e18} ETH` : "Loading..."}
            </SoftTypography>
            <SoftTypography variant="body2">
              Collateral: {collateralAmount ? `${Number(collateralAmount) / 1e18} ETH` : "Loading..."}
            </SoftTypography>
            <SoftTypography variant="body2">
              Repay By: {repayByTimestamp ? new Date(Number(repayByTimestamp) * 1000).toLocaleString() : "Loading..."}
            </SoftTypography>



            <SoftTypography variant="h6">Current Market Rates</SoftTypography>
            
            <SoftTypography variant="body2">
              Fixed Rate: {formatRate(fixedRate)}
            </SoftTypography>
            <SoftTypography variant="body2">
              Floating Rate: {formatRate(floatingRate)}
            </SoftTypography>


          </SoftBox>


          {/* Loan State Display */}
          <SoftTypography variant="h6">Loan Status</SoftTypography>
          <SoftTypography variant = "body2">
            {loadingState ? "Loading..." : stateLabel[loanState] || "Unknown"}
          </SoftTypography>

          {/* Switch Button */}
          <SoftBox mt={2} textAlign="center">
            <SoftButton
              color="info"
              onClick={handleSwitchRate}
              disabled={switchPending}
            >
              {switchPending ? "Switching..." : "Switch Rate Type"}
            </SoftButton>

            {switchSuccess && (
              <SoftTypography mt={2} color="success">
                Switched successfully!
              </SoftTypography>
            )}
          </SoftBox>
          
          {/* Refresh Button */}
          <SoftBox mt={2} textAlign="center">
            <SoftButton
              color="primary"
              onClick={handleRefreshRate}
              disabled={refreshPending}
            >
              {refreshPending ? "Refreshing..." : "Refresh Rates"}
            </SoftButton>

            {refreshSuccess && (
              <SoftTypography mt={2} color="success">
                Refreshed successfully!
              </SoftTypography>
            )}
          </SoftBox>
          



        </>
      )}
    </SoftBox>
  )
}
