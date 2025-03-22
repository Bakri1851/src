import React from 'react'
import './App.css'

import WalletConnect from './utils/walletConnect'
import LoanActions from './components/loanActions'
import { mainnet, sepolia } from 'viem/chains'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createPublicClient } from 'viem'


const queryClient = new QueryClient(); 

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

console.log("publicClient", publicClient);

const config = createConfig({
  autoConnect: true,
  publicClient
});

function App(){
  console.log("config", config);
  console.log("queryClient", queryClient);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
    <div>
      <h1>
      Rate Switching Loan
      </h1>
      <WalletConnect/>
      <LoanActions/>
    </div>
    </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App
