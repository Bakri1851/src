import React from "react"
import Card from "components/Card"
import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function ConnectWallet() {
  return (
    <Card>
      <SoftBox p={3}>
        <SoftTypography variant="h5">Connect Your Wallet</SoftTypography>
        <SoftBox mt={2}>
          <ConnectButton />
        </SoftBox>
      </SoftBox>
    </Card>
  )
}
