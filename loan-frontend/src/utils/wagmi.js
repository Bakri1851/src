import {createClient, configureChains, http, createConfig} from '@wagmi/core';
import {mainnet, sepolia} from '@wagmi/core/chains';
import {metaMask} from 'wagmi';
import {publicProvider} from 'wagmi';


const {chains, provider, webSocketProvider} = configureChains(
    [mainnet,sepolia],
    [publicProvider()]);


const client = createClient({
    autoConnect: true,
    connectors: [
        new metaMask({chains}),
        // Add more connectors here
    ],
    provider,
    webSocketProvider,
});

export {client, chains}