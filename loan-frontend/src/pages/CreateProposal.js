import FactoryConfig from 'constants/FactoryConfig';
import { useEffect, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useSoftUIController } from 'context';
import SoftInput from 'components/SoftInput';
import SoftButton from 'components/SoftButton';
import SoftTypography from 'components/SoftTypography';
import SoftBox from 'components/SoftBox';
import { useAccount } from 'wagmi';

import { parseEther } from 'viem';

const ORACLE_ABI = [
    {
        inputs: [],
        name: "latestRoundData",
        outputs: [
            { name: "roundId", type: "uint80" },
            { name: "answer", type: "int256" },
            { name: "startedAt", type: "uint256" },
            { name: "updatedAt", type: "uint256" },
            { name: "answeredInRound", type: "uint80" }
        ],
        stateMutability: "view",
        type: "function"
    }
];

export default function CreateProposal() {
    const [controller] = useSoftUIController(); 
    const direction = controller?.direction || 'ltr';

    const [form, setForm] = useState({
        loanAmount: '',
        feeAmount: '',
        collateral: '',
        repayBy: '',
        repayByDateString: '', // Add this for the date picker
        fixedRate: '',
        floatingRate: '',
        oracle: '0x8e604308BD61d975bc6aE7903747785Db7dE97e2',
    });

    const { isConnected } = useAccount();

    const {data: oracleData} = useReadContract({
        address: form.oracle,
        abi: ORACLE_ABI,
        functionName: 'latestRoundData',
        enabled: isConnected,
    });


    useEffect(() => {
        if (oracleData) {
            try {
                const price = Number(oracleData[1]);

                const marketFloatingRate = Math.floor(Number(price) / 1e4);
                const spread = 100; 
                const fixedRate = marketFloatingRate + spread;
                setForm((prevForm) => ({
                    ...prevForm,
                    fixedRate: fixedRate.toString(),
                    floatingRate: marketFloatingRate.toString(),
                }));

                console.log("Oracle price:", price);
                console.log("Market floating rate:", marketFloatingRate);
                console.log("Fixed rate:", fixedRate);
            } catch (error) {
                console.error('Error parsing oracle data:', error);
            }
        }
    }, [oracleData]);


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
        const dateString = e.target.value;
        const selectedDate = new Date(dateString);
        
        const minValidTime = new Date();
        minValidTime.setHours(minValidTime.getHours() + 1);
        
        if (selectedDate < minValidTime) {
            alert("Repayment date must be at least 1 hour in the future");
            
            const minValidDateString = minValidTime.toISOString().slice(0, 16);
            const minValidTimestamp = Math.floor(minValidTime.getTime() / 1000);
            
            setForm((prevForm) => ({
                ...prevForm,
                repayBy: minValidTimestamp.toString(),
                repayByDateString: minValidDateString,
            }));
        } else {
            const timestamp = Math.floor(selectedDate.getTime() / 1000);
            setForm((prevForm) => ({
                ...prevForm,
                repayBy: timestamp.toString(),
                repayByDateString: dateString,
            }));
        }
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted:', form);

    try {

        const loanAmount = parseEther(form.loanAmount);
        const feeAmount = parseEther(form.feeAmount);
        const collateral = parseEther(form.collateral);
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
                BigInt(form.fixedRate),
                BigInt(form.floatingRate),
                form.oracle,
            ],
            chainId: FactoryConfig.chainId,
        });

        alert("Please confirm the transaction in your wallet.");
        } catch (error) {
            console.error('Error sending transaction:', error);
        }
    
    }

    const formatRate = (rate) => {
        if (!rate) return "Loading...";
        // Convert from basis points to percentage with 2 decimal places
        return `${(Number(rate)/100).toFixed(2)}%`;
    };

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
                            icon = {{
                                component: <SoftTypography variant = "button" fontWeight = "regular">ETH</SoftTypography>,
                                direction: direction === "rtl" ? "right" : "right",
                            }}
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
                            icon = {{
                                component: <SoftTypography variant = "button" fontWeight = "regular">ETH</SoftTypography>,
                                direction: direction === "rtl" ? "right" : "right",
                            }}
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
                            icon = {{
                                component: <SoftTypography variant = "button" fontWeight = "regular">ETH</SoftTypography>,
                                direction: direction === "rtl" ? "right" : "right",
                            }}
                    />
                    </SoftBox>
                    <SoftBox mb={2}>
                        <SoftTypography variant = "button" fontWeight = "regular">Repay By</SoftTypography>
                        <SoftInput
                            type="datetime-local"
                            name="repayBy"
                            value={form.repayByDateString}  // Use the date string here
                            onChange={handleDateChange}
                            required
                            icon = {{
                                component: <SoftTypography fontWeight="regular"></SoftTypography>,
                                direction: direction === "rtl" ? "right" : "right",
                            }}
                        />
                    </SoftBox>
                    <SoftBox mb = {2}>
                        <SoftTypography variant = "button" fontWeight = "regular">
                            Fixed Rate (%)
                        </SoftTypography>
                        <SoftTypography variant = "body2">
                            {formatRate(form.fixedRate)}
                        </SoftTypography>
                    </SoftBox>
                    <SoftBox mb = {2}>
                        <SoftTypography variant = "button" fontWeight = "regular">
                            Floating Rate (%)
                        </SoftTypography>
                        <SoftTypography variant = "body2">
                            {formatRate(form.floatingRate)}
                        </SoftTypography>
                    </SoftBox>
                    <SoftBox mb = {2}>
                        <SoftButton
                            type = "submit"
                            variant = "gradient"
                            color = "info"
                            fullWidth
                            disabled = {isWaiting || !form.fixedRate}
                            onClick = {handleSubmit}
                            gradient = {{
                                from: "info",
                                to: "success",
                                deg: 45,
                            }}
                            >
                                {isWaiting ? "Creating..." : "Create Proposal"}
                            
                        </SoftButton>
                    </SoftBox>
                
                </form>
                
            )}
        </SoftBox>


    )
};

