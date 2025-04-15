import { rateSwitchingABI } from "./RateSwitchingABI";

// Central configuration for contract details
const ContractConfig = {
  address: "0x3aa92114937ad3ACB6504f542258E83ee6C781a6", // The only place you need to change the address
  abi: rateSwitchingABI,
  chainId: 11155111, // Sepolia
};

// Helper function to get contract config with optional overrides
export const getContractConfig = (overrides = {}) => {
  return {
    ...ContractConfig,
    ...overrides,
  };
};

export default ContractConfig;