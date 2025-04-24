import FactoryConfig from 'constants/FactoryConfig';
import { useEffect, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useSoftUIController } from 'context';
import SoftInput from 'components/SoftInput';
import SoftButton from 'components/SoftButton';
import SoftTypography from 'components/SoftTypography';
import SoftBox from 'components/SoftBox';
import { useAccount } from 'wagmi';
import { helpMakeProposal } from 'api/openai';
import ReactMarkdown from 'react-markdown';
import { parseEther } from 'viem';
import { formatRate } from 'utils/formatters';

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

    const [aiSuggestions, setAiSuggestions] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    const [form, setForm] = useState({
        loanAmount: '',
        feeAmount: '',
        collateral: '',
        repayBy: '',
        repayByDateString: '', 
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

    const getAiHelp = async () => {
        setAiLoading(true);
        try {
            const suggestions = await helpMakeProposal({
                loanAmount: form.loanAmount,
                feeAmount: form.feeAmount,
                collateral: form.collateral,
                repayByDateString: form.repayByDateString,
                fixedRate: formatRate(form.fixedRate),
                floatingRate: formatRate(form.floatingRate),
            });
            setAiSuggestions(suggestions);
        } catch (error) {
            console.error("Error getting AI help:", error);
        } finally {
            setAiLoading(false);
        }
    };

    const handleDateChange = (e) => {
        const dateString = e.target.value;
        const selectedDate = new Date(dateString);
        
        const minValidTime = new Date();
        minValidTime.setHours(minValidTime.getHours() + 0); //change the 0 to 1
    
        
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

        if (!form.loanAmount || !form.feeAmount || !form.collateral || !form.repayBy) {
            alert("Please fill in all fields.");
            return;
        }

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


    const handleEthAmountChange = (e) => {
        const { name, value } = e.target;
        
        const amount = parseFloat(value);
        
        // Get current values for ratio calculations
        const currentLoanAmount = name === "loanAmount" ? amount : parseFloat(form.loanAmount) || 0;
        const currentCollateral = name === "collateral" ? amount : parseFloat(form.collateral) || 0;
        const currentFee = name === "feeAmount" ? amount : parseFloat(form.feeAmount) || 0;
        
        const MIN_LOAN_AMOUNT = 0.00001;  // Minimum loan of 0.05 ETH 0.05
        const MAX_LOAN_AMOUNT = 100;   // Maximum loan of 100 ETH
        const MIN_COLLATERAL_RATIO = 1.5;  // Collateral must be at least 150% of loan 1.5
        const MAX_FEE_PERCENTAGE = 0.1;  // Fee can't exceed 10% of loan amount 0.1
        
        let errorMessage = "";
        let finalValue = value;
        
        // Apply validation based on field name
        if (name === "loanAmount") {
            if (amount < MIN_LOAN_AMOUNT) {
                errorMessage = `Loan amount must be at least ${MIN_LOAN_AMOUNT} ETH`;
                finalValue = MIN_LOAN_AMOUNT.toString();
            } else if (amount > MAX_LOAN_AMOUNT) {
                errorMessage = `Loan amount cannot exceed ${MAX_LOAN_AMOUNT} ETH`;
                finalValue = MAX_LOAN_AMOUNT.toString();
            }
            
            // Check if fee exceeds the maximum percentage
            if (currentFee > amount * MAX_FEE_PERCENTAGE) {
                errorMessage = `Fee amount exceeds ${MAX_FEE_PERCENTAGE * 100}% of loan amount`;
            }
        } 
        else if (name === "collateral") {
            const minCollateral = currentLoanAmount * MIN_COLLATERAL_RATIO;
            if (currentLoanAmount > 0 && amount < minCollateral) {
                errorMessage = `Collateral must be at least ${MIN_COLLATERAL_RATIO * 100}% of loan amount (${minCollateral.toFixed(2)} ETH)`;
                finalValue = minCollateral.toFixed(2);
            }
        } 
        else if (name === "feeAmount") {
            const maxFee = currentLoanAmount * MAX_FEE_PERCENTAGE;
            if (currentLoanAmount > 0 && amount > maxFee) {
                errorMessage = `Fee cannot exceed ${MAX_FEE_PERCENTAGE * 100}% of loan amount (${maxFee.toFixed(2)} ETH)`;
                finalValue = maxFee.toFixed(2);
            }
        }
        
        // Show error message if any
        if (errorMessage) {
            alert(errorMessage);
        }
        
        // Update form
        setForm((prevForm) => ({
            ...prevForm,
            [name]: finalValue,
        }));
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
                            onChange={handleEthAmountChange}
                            required
                            step = "0.01"
                            icon = {{
                                component: <SoftTypography variant = "button" fontWeight = "regular"></SoftTypography>,
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
                            onChange={handleEthAmountChange}
                            required
                            step = "0.01"
                            icon = {{
                                component: <SoftTypography variant = "button" fontWeight = "regular"></SoftTypography>,
                                direction: direction === "rtl" ? "right" : "right",
                            }}
                        />
                    </SoftBox>
                    <SoftBox mb={2}>
                        <SoftTypography variant = "button" fontWeight = "regular">Collateral (ETH)</SoftTypography>
                        <SoftInput
                            type="number"
                            name="collateral"
                            placeholder="1.5"
                            value={form.collateral}
                            onChange={handleEthAmountChange}
                            required
                            step = "0.01"
                            icon = {{
                                component: <SoftTypography variant = "button" fontWeight = "regular"></SoftTypography>,
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
                            variant = "gradient"
                            color = "info"
                            fullWidth
                            disabled = {aiLoading}
                            onClick = {getAiHelp}
                            
                            
                        >
                            {aiLoading ? "Thinking..." : "Get AI Suggestions"}
                        </SoftButton>
                    </SoftBox>
                    {aiSuggestions && (
                        <SoftBox 
                            mt={2}
                            p={2}
                            border="1px dashed"
                            borderColor="info.main"
                            borderRadius="10px"
                            backgroundColor="rgba(0, 142, 255, 0.1)"
                            width="100%"
                            textAlign="left"
                            maxHeight="300px"
                            maxWidth="800px"
                            overflow="auto"
                            mb={3}
                            sx={{
                                '&::-webkit-scrollbar': {
                                    width: '8px',
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(0, 142, 255, 0.3)',
                                },
                                wordBreak: "break-word",
                            }}
                        >
                            <SoftTypography variant="h6" fontWeight="bold" color="info.main" mb={1}>
                                AI Suggestions:
                            </SoftTypography>
                            <SoftBox sx={{
                                '& h1, & h2, & h3, & h4, & h5, & h6': {
                                    color: 'info.main',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    mt: 1,
                                    mb: 0.5
                                },
                                '& ul, & ol': {
                                    pl: 2
                                },
                                '& p': {
                                    mb: 1
                                }
                            }}>
                                <ReactMarkdown>
                                    {aiSuggestions}
                                </ReactMarkdown>
                            </SoftBox>
                        </SoftBox>
                    )}

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

