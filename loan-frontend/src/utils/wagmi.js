import {createClient, configureChains} from '@wagmi/core';
import {mainnet, sepolia} from '@wagmi/core/chains';
import {MetaMaskConnector} from '@wagmi/connectors';
import {publicProvider} from '@wagmi/core';
import { InjectedConnector } from '@wagmi/connectors';


const {chains, provider, webSocketProvider} = configureChains(
    [mainnet,sepolia],
    [publicProvider()]);

export const client = createClient({
    autoConnect: true,
    connectors: [
        new MetaMaskConnector({chains}),
        // Add more connectors here
    ],
    provider,
    webSocketProvider,
});

export {client, chains}