import { getContract } from 'viem';
import contractABI from './contractABI.json';

const contractAddress = "0x40d3345B2749c95d514523331c741fFC09117B95";

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

