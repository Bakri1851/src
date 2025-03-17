import React from 'react'
import ReactDOM from 'react-dom/client'
import {WagmiConfig} from 'wagmi';
import App from "./App";
import config from "./utils/wagmi";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


const queryClient = new QueryClient();
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
        </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>,
);
