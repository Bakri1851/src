import {LoanFactoryABI} from './LoanFactoryABI.js';

const FactoryConfig = {
    address: "0x48C299b1561b2c399CADD4FEa3e392d4462Bf5A0",
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
