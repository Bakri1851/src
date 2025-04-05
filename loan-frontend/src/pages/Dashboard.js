import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContracts, useReadContract, useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from '@wagmi/core'
import { rateSwitchingABI } from "constants/RateSwitchingABI"

export default function Dashboard() {
  const { isConnected } = useAccount()
  const { writeContract, isPending, isSuccess } = useWriteContract()
  const contractAddress = "0x506f886322DC644C43a3Dee8e07DD7205bf7AC50"
  const contractConfig = {
    address: contractAddress,
    abi: rateSwitchingABI,
    chainId: 11155111, // Sepolia
  }

  const { data: fixedRate } = useReadContract({
    address: contractAddress,
    abi: rateSwitchingABI,
    chainId: 11155111,
    functionName: "getFixedRate",
  })
  
  const { data: floatingRate } = useReadContract({
    address: contractAddress,
    abi: rateSwitchingABI,
    chainId: 11155111,
    functionName: "getFloatingRate",
  })
  


  // ✅ Read the current interest rate
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
      const result = await writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'switchRateType'
      });

      await waitForTransactionReceipt({
        hash: result.hash
      });

      // Refetch the current rate type
      await refetchRateType();
    } catch (error) {
      console.error('Switch rate failed:', error);
    }
  }

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

            <SoftTypography variant="h6">Current Market Rates</SoftTypography>
            
            <SoftTypography variant="body2">
              Fixed Rate: {formatRate(fixedRate)}
            </SoftTypography>
            <SoftTypography variant="body2">
              Floating Rate: {formatRate(floatingRate)}
            </SoftTypography>


          </SoftBox>

          {/* Switch Button */}
          <SoftBox mt={2} textAlign="center">
            <SoftButton
              color="info"
              onClick={handleSwitchRate}
              disabled={isPending}
            >
              {isPending ? "Switching..." : "Switch Rate Type"}
            </SoftButton>

            {isSuccess && (
              <SoftTypography mt={2} color="success">
                Switched successfully!
              </SoftTypography>
            )}
          </SoftBox>
        </>
      )}
    </SoftBox>
  )
}
