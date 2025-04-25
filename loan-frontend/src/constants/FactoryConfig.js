import { LoanFactoryABI } from "./LoanFactoryABI.js";

const FactoryConfig = {
  address: "0x6d2aafE138164a428e27015Dca3b7fC623BCEb57",
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
