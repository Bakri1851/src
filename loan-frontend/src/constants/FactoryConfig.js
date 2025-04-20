import {LoanFactoryABI} from './LoanFactoryABI.js';

const FactoryConfig = {
    address: "0x24c284CA025A21133194c926E637B74023806fcd",
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
