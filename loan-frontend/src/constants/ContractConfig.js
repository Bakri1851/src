import { rateSwitchingABI } from "./RateSwitchingABI";

// Central configuration for contract details
const ContractConfig = {
  address: "0x8aa018DcF5fA38077Eac3b7901314ad22E0adCcD", // The only place you need to change the address
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