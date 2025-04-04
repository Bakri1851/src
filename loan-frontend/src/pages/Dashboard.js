import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContracts, useReadContract, useWriteContract } from "wagmi"
import { rateSwitchingABI } from "constants/RateSwitchingABI"

export default function Dashboard() {
  const { isConnected } = useAccount()
  const { writeContract, isPending, isSuccess } = useWriteContract()
  const { writeContractAsync } = useWriteContract()
  const contractConfig = {
    address: "0x45121b6AaC4a161Aeee190feB153471661f50B63",
    abi: rateSwitchingABI,
    chainId: 11155111, // Sepolia
  }

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
      const tx = await writeContractAsync({
        ...contractConfig,
        functionName: "switchRateType", 
      })
      tx.wait(1) // Wait for 1 block confirmation

      refetchRateType() // ✅ Re-fetch updated rate from contract
    } catch (err) {
      console.error("Transaction failed:", err)
    }
  }

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
