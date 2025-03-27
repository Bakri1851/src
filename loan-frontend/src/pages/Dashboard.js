import React from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { useAccount,useBalance } from "wagmi";
import Card from "@mui/material/Card";

export default function Dashboard() {
    const {address} = useAccount();

    const {data:mainnetBalance,isLoading:loadingMainnet} = useBalance({
        address,
        chainId: 1,
        watch:true,
    })

    const {data:sepoliaBalance,isLoading:loadingSepolia} = useBalance({
        address,
        chainId: 11155111,
        watch:true
    })


    return (
        <SoftBox p={3} display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <SoftTypography variant="h3" mb={3}>
                Dashboard
            </SoftTypography>

            <Card style = {{padding: "20px", maginBottom: "20px"}}>
                <SoftBox mb={2}>
                    <SoftTypography variant="h6" color="text">
                        Wallet Address:
                    </SoftTypography>
                    <SoftTypography variant="body1" color="dark">
                        {address}
                    </SoftTypography>
                </SoftBox>
            </Card>
            <Card style = {{padding: "20px", maginBottom: "20px"}}>
                <SoftBox>
                    <SoftTypography variant="h6" color="text">
                        ETH Balance (mainnet):
                    </SoftTypography>
                    <SoftTypography variant="body1" color="dark">
                        {loadingMainnet ? "Loading..." : `${mainnetBalance?.formatted} ETH`}
                    </SoftTypography>
                </SoftBox>
            </Card>

            <Card style = {{padding: "20px", maginBottom: "20px"}}>
                <SoftBox>
                    <SoftTypography variant="h6" color="text">
                        Sepolia Balance:
                    </SoftTypography>
                    <SoftTypography variant="body1" color="dark">
                        {loadingSepolia ? "Loading..." : `${sepoliaBalance?.formatted} ETH`}
                    </SoftTypography>
                </SoftBox>
            </Card>

        </SoftBox>
    )
}