import {http, createConfig} from '@wagmi/core';
import {mainnet, sepolia} from '@wagmi/core/chains';
import {metaMask} from 'wagmi/connectors';


export const config = createConfig({
    chains: [mainnet, sepolia],
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
    },
    connectors: [metaMask()],
});

export default config;