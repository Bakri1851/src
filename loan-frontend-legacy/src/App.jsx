import React from "react";
import "./App.css";

import WalletConnect from "./utils/walletConnect";
import LoanActions from "./components/loanActions";
import { mainnet, sepolia } from "viem/chains";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createPublicClient } from "viem";

const queryClient = new QueryClient();

const config = createConfig({
  autoConnect: true,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http("", { url: "https://mainnet.infura.io/v3/" }),
    [sepolia.id]: http("", { url: "https://sepolia.infura.io/v3/" }),
  },
});

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div>
          <h1>Rate Switching Loan</h1>
          <WalletConnect />
          <LoanActions />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
