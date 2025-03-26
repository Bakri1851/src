import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'viem/chains'
import { createPublicClient } from 'viem'
import { injected } from 'wagmi/connectors'

const chains = [mainnet, sepolia]

const { connectors } = getDefaultWallets({
  appName: 'Loan dApp Dashboard',
  projectId: '27083116385d1296f7fd233f6f547755',
  chains,
})

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient: createPublicClient({
    chain: sepolia ,
    transport: http(),
  }),
})

export { chains }
