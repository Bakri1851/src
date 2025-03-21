import React, {useEffect, useState} from "react";
import {usePublicClient, useWalletClient} from "wagmi";
import {getContract} from "../utils/contract";

const LoanActions = () => {
    const publicClient = usePublicClient();

    const {data: walletClient} = useWalletClient();
    if (!walletClient) {
        throw new Error("Wallet client not found");
        return <p>Connect your wallet</p>;
    }

    const [loanAmount, setLoanAmount] = useState("");
    const [repayAmount, setRepayAmount] = useState("");
    const [loanState, setLoanState] = useState("");
    
    const getLoanState = async () => {
        try{
            const contract = getContract(publicClient);
            const state = await contract.getLoanState();
            console.log(state);
            setLoanState(state);
        }
        catch (error) {
            console.error(error);
            alert(error);
        }
    };

    const takeLoan = async () => {
        if (!publicClient){
            console.error("Metamask wallet not found");
            return;
        }

        try{
            const contract = getContract(publicClient);
            const transaction = await contract.takeLoan({value: ethers.utils.parseEther(loanAmount),});
            await transaction.wait();
            alert("Loan taken successfully");
            getLoanState();
        } catch (error) {
            console.error(error);
            alert("An error occurred while taking the loan");
        }
    };

    const repayLoan = async () => {
        if (!publicClient) {
            console.error("Metamask wallet not found");
            return;
        }

        try {
            const contract = getContract(publicClient);
            const transaction = await contract.repayLoan({value: ethers.utils.parseEther(repayAmount),});
            await transaction.wait();
            alert("Loan repaid successfully");
            getLoanState();
        } catch (error) {
            console.error(error);
            alert("An error occurred while repaying the loan");
        }
    };

    useEffect(() => {
        if (publicClient) {
            getLoanState();
        }
    }, [publicClient]);
    
    return (
        <div>
            <h2>Loan Actions</h2>
            <p><strong>Loan State:</strong> {loanState}</p>
            <input
                type = "text"
                placeholder="Enter loan amount"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
            />
            <button onClick={takeLoan}>Take Loan</button>

            <input
                type="text"
                placeholder="Enter repay amount"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
            />
            <button onClick={repayLoan}>Repay Loan</button>

        </div>
    );

};

export default LoanActions;