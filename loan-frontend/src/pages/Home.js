import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContracts, useReadContract, useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from '@wagmi/core'
import { rateSwitchingABI } from "constants/RateSwitchingABI"

export default function Home() {
    const { isConnected } = useAccount()
    const { writeContract, switchPending, switchSuccess, 
        refreshPending, refreshSuccess
    } = useWriteContract();
    
    // ✅ Get the contract address and ABI
    const contractAddress = "0x40d3345B2749c95d514523331c741fFC09117B95"
    const contractConfig = {
        address: contractAddress,
        abi: rateSwitchingABI,
        chainId: 11155111, // Sepolia
    }
    
    return (
        <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        </SoftBox>
        </SoftBox>
    )
}