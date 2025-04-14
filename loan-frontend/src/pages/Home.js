import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContracts, useReadContract, useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from '@wagmi/core'
import { rateSwitchingABI } from "constants/RateSwitchingABI"
import ContractConfig from "constants/ContractConfig"
export default function Home() {
    const { isConnected } = useAccount()
    const { writeContract, switchPending, switchSuccess, 
        refreshPending, refreshSuccess
    } = useWriteContract();
    
    // ✅ Get the contract address and ABI
    const contractConfig = ContractConfig
    
    
    return (
        <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        </SoftBox>
        </SoftBox>
    )
}