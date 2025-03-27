import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"


export default function Dashboard() {
    const {isConnected} = useAccount();

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
