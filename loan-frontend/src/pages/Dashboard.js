import React from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { useAccount,useBalance } from "wagmi";

export default function Dashboard() {
    const {address} = useAccount();

    const {data:balanceData,isLoading} = useBalance({
        address,
        chainId: 1,
        watch:true,
    })

    return (
        <SoftBox p={3} display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <SoftTypography variant="h3" mb={3}>
                Dashboard
            </SoftTypography>
            <SoftBox mb={2}>
                <SoftTypography variant="h6" color="text">
                    Wallet Address:
                </SoftTypography>
                <SoftTypography variant="body1" color="dark">
                    {address}
                </SoftTypography>
            </SoftBox>

            <SoftBox>
                <SoftTypography variant="h6" color="text">
                    ETH Balance (mainnet):
                </SoftTypography>
                <SoftTypography variant="body1" color="dark">
                    {isLoading ? "Loading..." : `${balanceData?.formatted} ETH`}
                </SoftTypography>
            </SoftBox>
        </SoftBox>
    )
}