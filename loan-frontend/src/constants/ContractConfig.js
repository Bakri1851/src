import { rateSwitchingABI } from "./RateSwitchingABI";

const ContractConfig = {
  address: "0x0283BA5b0932A911868D649Db3a6B3f578A66df8", 
  abi: rateSwitchingABI,
  chainId: 11155111, // Sepolia
};

export const getContractConfig = (overrides = {}) => {
  return {
    ...ContractConfig,
    ...overrides,
  };
};

export default ContractConfig;
