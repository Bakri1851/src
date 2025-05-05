import { LoanFactoryABI } from "./LoanFactoryABI.js";

const FactoryConfig = {
  address: "0x33036Dcd0C6Db53e0B9144d09800083F69fF06E2",
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
