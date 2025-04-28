import { LoanFactoryABI } from "./LoanFactoryABI.js";

const FactoryConfig = {
  address: "0x97bE1eDe2ac0525A63bE38F87E5FffB55be4375c",
  abi: LoanFactoryABI,
  chainId: 11155111, // Sepolia
};

export const getFactoryConfig = (overrides = {}) => {
  return {
    ...FactoryConfig,
    ...overrides,
  };
};
export default FactoryConfig;
