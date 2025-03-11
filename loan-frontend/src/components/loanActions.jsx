import React, {useState} from "react";
import {useProvider} from "@wagmi/core";
import {getContract} from "../utils/contract";

const LoanActions = () => {
    const provider = userProvider();
    const contract = getContract(provider);
    const [loanAmount, setLoanAmount] = useState("");

    const handleTakeLoan = async () => {
        try{
            const tx = await contract.takeLoan({
                value: ethers.utils.parseEther(loanAmount),
                });
            await tx.wait();
            alert("Loan taken successfully");
        } catch (error) {
            console.error(error);
            alert("An error occurred while taking the loan");
        }
    };

    return (
        <div>
            <input
                type = "text"
                placeholder="Enter loan amount"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
            />
            <button onClick={handleTakeLoan}>Take Loan</button>
        </div>
    );

};

export default LoanActions;