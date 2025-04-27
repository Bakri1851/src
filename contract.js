import { walletClient, initializeWallet } from "./wallet";
import { getContract } from "viem";
import contractABI from "./utils/contractABI.json";

const CONTRACT_ADDRESS = "0x8d4B4095bc4239cd368D9bf720E0dBC73365e70a";

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
    throw new Error(
      "Wallet client is not available. Please connect your wallet first."
    );
  }

  return getContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    client: walletClient,
  });
}
