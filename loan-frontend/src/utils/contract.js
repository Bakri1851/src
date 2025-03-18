import { ethers } from 'ethers';
import { WagmiConfig } from 'wagmi';
import contractABI from './contractABI.json';

const contractAddress = "0x5cc4Fe075c77289C70534ed5Bf3D3a4cc6C1FFA5";// Add the contract address here

if (!window.ethereum) {
  alert("Please install MetaMask to use this dApp");
}

const getContract = async => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = provider.getSigner();

  return new ethers.Contract(contractAddress, contractABI, signer);
};

export { getContract };
