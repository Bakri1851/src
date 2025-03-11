import {ethers} from 'ethers';
import contractABI from './contractABI.json';

const contractAddress = "0x1A088e243A356d4C334654DeAdbf5976136AE515";// Add the contract address here

const getContract = (provider) => {
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
};

export {getContract};
