import { ethers } from 'ethers';
import { WagmiConfig } from 'wagmi';
import contractABI from './contractABI.json';

const contractAddress = "0x4048BB34963358FEAEf9D577dbc32b4d25b4c10a";// Add the contract address here

if (!window.ethereum) {
  alert("Please install MetaMask to use this dApp");
}

export const getContract = (provider) => {
  if (!provider) throw new Error("Provider is required");

  const signer = provider.getSigner();

  return new ethers.Contract(contractAddress, contractABI, signer);
};

export { getContract };
