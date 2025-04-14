import { rateSwitchingABI } from "./RateSwitchingABI";

// Central configuration for contract details
const ContractConfig = {
  address: "0x52CC69bFec2cE3334AE1880487614bd937Ca0E74", // The only place you need to change the address
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