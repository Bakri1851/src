import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

const { wallets } = getDefaultWallets({
  appName: 'Loan dApp Dashboard',
  projectId: '6c6156acc9ac40a7bf297c5e502bbd16',
  chains: [mainnet, sepolia],
})

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: wallets,
})

export { mainnet, sepolia as chains }
