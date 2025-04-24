import {LoanFactoryABI} from './LoanFactoryABI.js';

const FactoryConfig = {
    address: "0x718424265DCCfa1dc4fA9681cA31b4905Cb76E8a",
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
