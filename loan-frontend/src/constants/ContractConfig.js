import { rateSwitchingABI } from "./RateSwitchingABI";

// Central configuration for contract details
const ContractConfig = {
  address: "0xfE8995b5B2c94cf02Fc3faf3ac7849EbAe525Bbc", // The only place you need to change the address
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