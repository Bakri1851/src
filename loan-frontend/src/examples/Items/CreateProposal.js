import FactoryConfig from 'constants/FactoryConfig';
import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import SoftInput from 'components/SoftInput';
import SoftButton from 'components/SoftButton';
import SoftTypography from 'components/SoftTypography';
import SoftBox from 'components/SoftBox';
import { useAccount } from 'wagmi';


export default function CreateProposal() {
    
    const [form, setForm] = useState({
        loanAmount: '',
        feeAmount: '',
        collateral: '',
        repayBy: '',
        fixedRate: '',
        floatingRate: '',
        oracle: '0xceA6Aa74E6A86a7f85B571Ce1C34f1A60B77CD29',
    });

    const { isConnected } = useAccount();
    const {writeContract, data: txHash, error: writeError} = useWriteContract();
    const {isLoading: isWaiting, isSuccess} = useWaitForTransactionReceipt({
        hash: txHash,
        onSuccess: (receipt) => {
            console.log('Transaction receipt:', receipt);
        },
        onError: (error) => {
            console.error('Error waiting for transaction receipt:', error);
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));

    }

    const handleDateChange = (e) => {
        const date = new Date(e.target.value);
        const timestamp = Math.floor(date.getTime() / 1000);
        setForm((prevForm) => ({
            ...prevForm,
            repayBy: timestamp.toString(),
        }));
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted:', form);

    try {

        const loanAmount = form.loanAmount;
        const feeAmount = form.feeAmount;
        const collateral = form.collateral;
        const repayBy = form.repayBy;
        const contract = FactoryConfig.contract;
        
        await writeContract({
            address: FactoryConfig.address,
            abi: FactoryConfig.abi,
            functionName: 'createProposal',
            args: [
                loanAmount,
                feeAmount,
                collateral,
                repayBy,
                form.fixedRate,
                form.floatingRate,
                form.oracle,
            ],
            chainId: FactoryConfig.chainId,
        });

        alert("Please confirm the transaction in your wallet.");
        } catch (error) {
            console.error('Error sending transaction:', error);
        }
    
    }


    return(
        <SoftBox mt = {5} mx = "auto" p = {4} width = "fit-content" backgroundColor = "white" borderRadius = "xl" boxShadow = "lg" >
            <SoftTypography variant = "h4" fontWeight = "bold" mb = {2} textAlign = "center" >
                 
                Create Proposal 
            </SoftTypography>

            {!isConnected ? (
                <SoftBox textAlign="center">
                    <SoftTypography  mb={2} textAlign="center">
                        Please connect your wallet to create a proposal.
                    </SoftTypography>
                </SoftBox>    
            
            ) : (
                <form onSubmit={handleSubmit}>
                    <SoftBox mb={2}>
                        <SoftTypography variant = "button" fontWeight = "regular">Loan Amount (ETH)</SoftTypography>
                        <SoftInput
                            type="number"
                            name="loanAmount"
                            placeholder="1.0"
                            value={form.loanAmount}
                            onChange={handleChange}
                            required
                            step = "0.01"
                        />
                    </SoftBox>
                    <SoftBox mb={2}>
                        <SoftTypography variant = "button" fontWeight = "regular">Fee Amount (ETH)</SoftTypography>
                        <SoftInput
                            type="number"
                            name="feeAmount"
                            placeholder="0.1"
                            value={form.feeAmount}
                            onChange={handleChange}
                            required
                            step = "0.01"
                        />
                    </SoftBox>
                    <SoftBox mb={2}>
                        <SoftTypography variant = "button" fontWeight = "regular">Collateral (ETH)</SoftTypography>
                        <SoftInput
                            type="number"
                            name="collateral"
                            placeholder="0.5"
                            value={form.collateral}
                            onChange={handleChange}
                            required
                            step = "0.01"
                    />
                    </SoftBox>
                    <SoftBox mb={2}>
                        <SoftTypography variant = "button" fontWeight = "regular">Repay By</SoftTypography>
                        <SoftInput
                            type="datetime-local"
                            name="repayBy"
                            value={form.repayBy}
                            onChange={handleDateChange}
                            required
                        />
                    </SoftBox>
                    <SoftBox mt = {4} mb = {1} textAlign = "center">
                        <SoftButton
                            type = "button"
                            variant = "gradient"
                            color = "info"
                            fullWidth
                            disabled = {isWaiting || !form.fixedRate}>
                                {isWaiting ? "Waiting..." : "Set Fixed Rate"}
                        </SoftButton>
                    </SoftBox>
                </form>
                
            )}
        </SoftBox>


    )
};
