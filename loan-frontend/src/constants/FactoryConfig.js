import { LoanFactoryABI } from "./LoanFactoryABI.js";

const FactoryConfig = {
  address: "0xBec5e5a9B6580492BBF0F17D2131115652F1c215",
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
