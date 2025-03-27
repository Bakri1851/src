import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia,polygon, arbitrum, goerli, optimism, base, avalanche, bsc, zora  } from 'wagmi/chains'

// Define supported chains
const chains = [mainnet, sepolia, polygon, arbitrum, goerli, optimism, base, avalanche, bsc, zora]

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
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [goerli.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [avalanche.id]: http(),
    [bsc.id]: http(),
    [zora.id]: http(),
  },
})

export { chains }