import React from "react";
import { readContract } from "@wagmi/core";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import FactoryConfig from "constants/FactoryConfig";
import Card from "@mui/material/Card";
import { wagmiConfig } from "../../wagmi.js";
import { useReadContract } from "wagmi";

function UtilizationDisplay() {
  const config = wagmiConfig;

  const { data: utilizationRate, isLoading: isLoadingUtilization } = useReadContract({
    address: FactoryConfig.address,
    abi: FactoryConfig.abi,
    functionName: "getUtilizationRate",
    watch: true,
  });
  console.log("Utilization Rate:", utilizationRate);

  const { data: floatingRate, isLoading: isLoadingFloating } = useReadContract({
    address: FactoryConfig.address,
    abi: FactoryConfig.abi,
    functionName: "getCurrentFloatingRate",
    watch: true,
  });

  console.log("Floating Rate:", floatingRate);

  const formattedUtilizationRate = isLoadingUtilization
    ? "Loading..."
    : utilizationRate !== undefined
    ? (Number(utilizationRate) / 100).toFixed(2) + "%"
    : "Error loading";

  const formattedFloatingRate = isLoadingFloating
    ? "Loading..."
    : floatingRate !== undefined
    ? (Number(floatingRate) / 100).toFixed(2) + "%"
    : "Error loading";

  return (
    <Card>
      <SoftBox p={3}>
        <SoftTypography variant="h6" fontWeight="medium" mb={2}>
          Market Conditions
        </SoftTypography>

        <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
          <SoftTypography variant="body2" color="text">
            Current Utilization:
          </SoftTypography>
          <SoftTypography variant="body2" fontWeight="medium">
            {formattedUtilizationRate}
          </SoftTypography>
        </SoftBox>

        <SoftBox display="flex" justifyContent="space-between">
          <SoftTypography variant="body2" color="text">
            Current Floating Rate:
          </SoftTypography>
          <SoftTypography variant="body2" fontWeight="medium">
            {formattedFloatingRate}
          </SoftTypography>
        </SoftBox>

        <SoftBox mt={2}>
          <SoftTypography variant="caption" color="text" fontStyle="italic">
            Rates adjust based on utilization: higher market utilization leads to higher floating
            rates.
          </SoftTypography>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

export default UtilizationDisplay;
