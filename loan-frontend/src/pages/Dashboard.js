import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContracts, useReadContract, useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from '@wagmi/core'
import { rateSwitchingABI } from "constants/RateSwitchingABI"
import {useState} from "react"

export default function Dashboard() {
  const { isConnected } = useAccount()
  const { writeContract, switchPending, switchSuccess} = useWriteContract();
   
  const [refreshPending, setRefreshPending] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  
  const contractAddress = "0xE26e0Cee85cc8eC6ED36e43b185Acfb13C86C37E"
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
  
  const { data: floatingRate,
    refetch: refetchFloatingRate,
    isLoading: loadingFloatingRate,
   } = useReadContract({
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
    setRefreshPending(true);
    setRefreshSuccess(false);
  
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
      setRefreshPending(false);
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
