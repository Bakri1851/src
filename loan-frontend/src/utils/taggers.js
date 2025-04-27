import { parseEther } from "viem";

export const TAG_TYPES = {
  SHORT_TERM: "Short-term",
  MID_TERM: "Mid-term",
  LONG_TERM: "Long-term",
  LOW_COLLATERAL: "Low collateral",
  OVERCOLLATERALIZED: "Overcollateralized",
  HIGH_YIELD: "High yield",
  STABLE: "Stable",
  MODERATE_YIELD: "Moderate yield",
};

export const TAG_COLORS = {
  [TAG_TYPES.SHORT_TERM]: "rgb(194,26,0)",
  [TAG_TYPES.MID_TERM]: "rgb(245, 225, 2)",
  [TAG_TYPES.LONG_TERM]: "dark",
  [TAG_TYPES.LOW_COLLATERAL]: "rgb(194,26,0)",
  [TAG_TYPES.OVERCOLLATERALIZED]: "rgb(16, 201, 19)",
  [TAG_TYPES.HIGH_YIELD]: "rgb(194,26,0)",
  [TAG_TYPES.STABLE]: "rgb(16, 201, 19)",
  [TAG_TYPES.MODERATE_YIELD]: "rgb(245, 225, 2)",
};

export const getProposalTags = (proposal) => {
  const tags = [];

  const now = Math.floor(Date.now() / 1000);
  const daysUntilRepayment = Math.floor((Number(proposal.repayByTimestamp) - now) / (60 * 60 * 24));

  if (daysUntilRepayment < 7) {
    tags.push({ label: "Short-term", color: "rgb(194,26,0)" });
  } else if (daysUntilRepayment <= 30) {
    tags.push({ label: "Mid-term", color: "rgb(245, 225, 2)" });
  } else {
    tags.push({ label: "Long-term", color: "dark" });
  }

  const loanAmountEth = Number(proposal.loanAmount) / 10 ** 18;
  const collateralAmountEth = Number(proposal.ethCollateralAmount) / 10 ** 18;
  const collateralRatio = collateralAmountEth / loanAmountEth;

  if (collateralRatio < 2) {
    tags.push({ label: "Low collateral", color: "rgb(194,26,0)" });
  } else if (collateralRatio >= 2) {
    tags.push({ label: "Overcollateralized", color: "rgb(16, 201, 19)" });
  }

  const fixedRate = Number(proposal.fixedRate) / 100;
  const floatingRate = Number(proposal.floatingRate) / 100;
  const highestRate = Math.max(fixedRate, floatingRate);

  if (highestRate >= 1.2) {
    tags.push({ label: "High yield", color: "rgb(194,26,0)" });
  } else if (highestRate <= 1.05) {
    tags.push({ label: "Stable", color: "rgb(16, 201, 19)" });
  } else {
    tags.push({ label: "Moderate yield", color: "rgb(245, 225, 2)" });
  }

  return tags;
};
