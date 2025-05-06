import { LoanFactoryABI } from "./LoanFactoryABI.js";

const FactoryConfig = {
  address: "0xb9FBA03442d31db21D85237A141318B50231C4C5",
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
