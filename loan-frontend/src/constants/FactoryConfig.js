import {LoanFactoryABI} from './LoanFactoryABI.js';

const FactoryConfig = {
    address: "0x3F7EBBeaE982452f417068f9d55c9F757aa7BAB7",
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
