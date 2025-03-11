import {ethers} from 'ethers';
import contractABI from './contractABI.json';

const contractAddress = "";// Add the contract address here

const getContract = (provider) => {
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
};

export {getContract};
