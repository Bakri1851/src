import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContract, useWriteContract } from "wagmi"
import { rateSwitchingABI } from "constants/RateSwitchingABI"

export default function Dashboard() {
  const { isConnected } = useAccount()
  const { writeContract, isPending, isSuccess } = useWriteContract()


  const contractConfig = {
    address: "0x8d4b4095bc4239cd368d9bf720e0dbc73365e70a",
    abi: rateSwitchingABI,
    chainId: 11155111, // Sepolia
  }

  // ✅ Reading rate type from the contract
  const { data: rateType } = useReadContract({
    ...contractConfig,
    functionName: "currentRateType",
  })

  // ✅ Writing to the contract
  const switchRateType = useWriteContract({
    ...contractConfig,
    functionName: "switchRateType",
  })

  const rateTypeLabel = {
    0: "Fixed",
    1: "Floating",
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
          {/* Rate Type Display */}
          <SoftBox
            p={3}
            mt={3}
            borderRadius="lg"
            boxShadow="md"
            backgroundColor="white"
          >
            <SoftTypography variant="h6">Current Interest Rate</SoftTypography>
            <SoftTypography variant="body1" color="dark">
              {rateType !== undefined ? rateTypeLabel[rateType] : "Loading..."}
            </SoftTypography>
          </SoftBox>

          {/* Switch Rate Button */}
          <SoftBox mt={2} textAlign="center">
            <SoftButton
              color="info"
              onClick={() => writeContract(
                {
                    address: "0x8d4b4095bc4239cd368d9bf720e0dbc73365e70a",
                    abi: rateSwitchingABI,
                    functionName: "switchRateType",
                }
              )}
              disabled={isPending}
            >
              {isPending ? "Switching..." : "Switch Rate Type"}
            </SoftButton>

            {isSuccess && (
              <SoftTypography mt={2} color="success">
                Transaction sent!
              </SoftTypography>
            )}
          </SoftBox>
        </>
      )}
    </SoftBox>
  )
}
