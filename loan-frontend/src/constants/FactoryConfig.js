import {LoanFactoryABI} from './LoanFactoryABI.js';

const FactoryConfig = {
    address: "0x8eb9D46f76d1273ce3D385Ab99e4123F72BaDfEa",
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
