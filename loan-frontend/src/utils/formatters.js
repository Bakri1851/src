export const formatEther = (value) => {
  if (!value) return "0.00";
  try {
    return (Number(value) / 1e18).toFixed(6);
  } catch (error) {
    console.error("Error formatting ether:", error);
    return "Error";
  }
};

export const formatTimestamp = (timestamp) =>
  timestamp ? new Date(Number(timestamp) * 1000).toLocaleString() : "Loading...";

export const formatRate = (rate) => (rate ? `${(Number(rate) / 100).toFixed(2)}%` : "Loading...");

export const shortenAddress = (address) => {
  if (!address) return "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatState = (state) => {
  const states = ["Created", "Funded", "Accepted", "Taken", "Repaid", "Liquidated"];
  return states[state] || "Unknown";
};

export const getRateTypeLabel = (type) => {
  const types = {
    0: "Fixed",
    1: "Floating",
  };
  return types[type] || "Unknown";
};

export const rateTypeLabel = {
  0: "Fixed",
  1: "Floating",
};

export const interestCalculationTypeLabel = {
  0: "Simple Interest (APR)",
  1: "Compound Interest (APY)",
};
