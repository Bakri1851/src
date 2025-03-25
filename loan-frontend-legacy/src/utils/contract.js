import { getContract } from 'viem';
import contractABI from './contractABI.json';

const contractAddress = "0x4048BB34963358FEAEf9D577dbc32b4d25b4c10a";

if (!window.ethereum) {
  alert("Please install MetaMask to use this dApp");
}

export const getLoanContract = (walletClient) => {
  if (!walletClient) throw new Error("Wallet client is not available");

  return getContract({
    abi: contractABI,
    address: contractAddress,
    client: walletClient,
  })
};

