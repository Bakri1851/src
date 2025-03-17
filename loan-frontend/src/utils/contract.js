import { ethers } from 'ethers';
import { WagmiConfig } from 'wagmi';
import contractABI from './contractABI.json';

const contractAddress = "0x1A088e243A356d4C334654DeAdbf5976136AE515";// Add the contract address here

if (!window.ethereum) {
  alert("Please install MetaMask to use this dApp");
}

const getContract = async => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = provider.getSigner();

  return new ethers.Contract(contractAddress, contractABI, signer);
};

export { getContract };
