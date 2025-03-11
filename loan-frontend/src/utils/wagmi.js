import {createClient, configureChains} from '@wagmi/core';
import {mainnet, sepolia} from '@wagmi/chains';
import {MetaMaskConnector} from '@wagmi/connectors';
import {publicProvider} from '@wagmi/providers/public';
//import { InjectedConnector } from '@wagmi/connectors/injected';


const {chains, provider, webSocketProvider} = configureChains(
    [mainnet,sepolia],
    [publicProvider()]);

const client = createClient({
    autoConnect: true,
    connectors: [
        new MetaMaskConnector({chains}),
        // Add more connectors here
    ],
    provider,
    webSocketProvider,
});

export {client, chains}