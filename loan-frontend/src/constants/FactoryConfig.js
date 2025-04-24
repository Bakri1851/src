import {LoanFactoryABI} from './LoanFactoryABI.js';

const FactoryConfig = {
    address: "0xFC9ae12BC665A405dca403a97c0fb4DB807897A3",
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
