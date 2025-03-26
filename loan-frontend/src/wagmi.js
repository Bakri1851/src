import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Define supported chains
const chains = [mainnet, sepolia]

// Configure wallet connections
const { connectors } = getDefaultWallets({
  appName: 'Loan dApp Dashboard',
  projectId: '27083116385d1296f7fd233f6f547755',
  chains,
})

// Create Wagmi configuration
export const wagmiConfig = createConfig({
  autoConnect: true,
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

export { chains }