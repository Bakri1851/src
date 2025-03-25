import { walletClient, initializeWallet } from './wallet';
import { getContract } from 'viem';
import contractABI from './utils/contractABI.json';

const CONTRACT_ADDRESS = "0x4048BB34963358FEAEf9D577dbc32b4d25b4c10a";

export const isWalletConnected = async () => {
  if (!walletClient) {
    try {
      await initializeWallet();
    } catch (error) {
      return false;
    }
  }
  return true;
};

export function getLoanContract() {
  if (!walletClient) {
    throw new Error("Wallet client is not available. Please connect your wallet first.");
  }

  return getContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    client: walletClient,
  });
}
