import { rateSwitchingABI } from "./RateSwitchingABI";

// Central configuration for contract details
const ContractConfig = {
  address: "0xb92c9aD95AB88e9A5d5BDc00DB2E65dEf256B837", // The only place you need to change the address
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