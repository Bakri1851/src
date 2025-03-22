import React from 'react'
import './App.css'

import WalletConnect from './utils/walletConnect'
import LoanActions from './components/loanActions'
import { mainnet, sepolia } from 'viem/chains'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createPublicClient } from 'viem'

const queryClient = new QueryClient(); 

const publicClient = new createPublicClient({
  chain: sepolia,
  transport: http(),
  queryClient
});

const config = createConfig({
  autoConnect: true,
  publicClient
});


function App(){

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
