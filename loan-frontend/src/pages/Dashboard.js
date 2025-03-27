import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"
import { rateSwitchingABI } from "constants/RateSwitchingABI"
import { useReadContract,useWriteContract } from "wagmi"


export default function Dashboard() {
    const {isConnected} = useAccount();

    const contractConfig = {
        address: "0x8d4b4095bc4239cd368d9bf720e0dbc73365e70a",
        abi: rateSwitchingABI,
        chainId: 11155111,
    }

    const {data:rateType} = useReadContract({
        ...contractConfig,
        functionName: "currentRateType",
    })

    const {data:switchRate} = useWriteContract({
        ...contractConfig,
        functionName: "switchRateType",
    })




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
        {!isConnected &&(
            <SoftTypography variant="body2" mt={1}>
            Please connect your wallet to continue
            </SoftTypography>
            )}
        <SoftBox mt={3}>
        <ConnectButton />
        </SoftBox>
    </SoftBox>
    )
}
