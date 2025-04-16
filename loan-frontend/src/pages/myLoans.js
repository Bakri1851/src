import SoftBox from "components/SoftBox"
import SoftTypography from "components/SoftTypography"
import SoftButton from "components/SoftButton"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useReadContracts, useReadContract, useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from '@wagmi/core'
import ContractConfig from "constants/ContractConfig"
import FactoryConfig from "constants/FactoryConfig"
import { FeeCapTooHighError } from "viem"
import { getFactoryConfig } from "constants/FactoryConfig"
import { useEffect,useState } from "react"

export default function MyLoans() {
    const { address, isConnected } = useAccount();
    const [allLoanAddress, setLoanAddress] = useState([]);
    const [userLoans, setUserLoans] = useState([]);

    const factoryConfig = getFactoryConfig();
    const { data: allLoans } = useReadContract({
        ...factoryConfig,
        functionName: "getAllLoans",
    });


    useEffect(() => {
        const fetchLoans = async () => {
            if (!allLoans || !Array.isArray(allLoans)) return;

            const filteredLoans = [];

            for (const loanAddress of allLoans) {
                try {
                    const response = await readContract({
                        address: loanAddress,
                        abi: ContractConfig.abi,
                        functionName: "getBorrower",
                    });
                    if (response && response.toLowerCase() === address.toLowerCase()) {
                        filteredLoans.push(loanAddress);
                    }
                } catch (error) {
                    console.error("Error fetching loan details:", error);
                }
            }
            setUserLoans(filteredLoans);
        };
        if (isConnected && allLoans) {
            fetchLoans();
        }
    }, [allLoans, address, isConnected]);

    const fetchLoanDetails = async (loanAddress) => {
        const config = {
            address: loanAddress,
            abi: ContractConfig.abi,
        };

        try {
            const [lender,loanAmount,state] = await Promise.all
([
                readContract({ ...config, functionName: "getLender" }),
                readContract({ ...config, functionName: "getLoanAmount" }),
                readContract({ ...config, functionName: "getLoanState" }),
            ]);
            return { lender, loanAmount, state };
        } catch (error) {
            console.error("Error fetching loan details:", error);
            return null;
        }
    };
    const formatState = (state) => {
        const states = [
            "Created",
            "Funded",
            "Accepted",
            "Taken",
            "Repaid",
            "Liquidated",
        ];
        return states[state] || "Unknown";
    };

    return (

        <SoftBox mt= {5} mx = "auto" width = "fit-content" backgroundColor = "white" borderRadius = "xl" boxShadow = "lg" textAlign = "center" >
            <SoftTypography variant = "h5" fontWeight = "bold" mb = {2} textAlign = "center" >
            Loans You Funded
            </SoftTypography>
            {!isConnected && (
                <SoftTypography mt variant = "body2" >
                    Please connect your wallet to view your loans.
                </SoftTypography>
            )}
            {isConnected &&(
                <>
                {userLoans.length == 0 ? (
                    <SoftTypography mt variant = "body2" textAlign = "centre" > No loans found. </SoftTypography>
                ) : (
                    userLoans.map((loanAddress, index) => (
                        <SoftBox key = {index} mb = {3} p = {2} backgroundColor = "#f9f9f9" borderRadius = "md" boxShadow = "sm" textAlign = "centre" >
                            <SoftTypography variant = "h6" fontWeight = "bold" mb = {1} > Loan Address: {loanAddress} </SoftTypography>
                            <SoftButton variant = "outlined" color = "primary" onClick = {() => fetchLoanDetails(loanAddress)} > {loanAddress} </SoftButton>

                            <SoftTypography variant = "body2" mt = {1} > Loan Amount: </SoftTypography>
                            <SoftTypography variant = "body2" mt = {1} > {loanAddress.loanAmount?.toString()} ETH </SoftTypography>

                            <SoftTypography variant = "body2" mt = {1} > Status: </SoftTypography>
                            <SoftTypography variant = "body2" mt = {1} > {formatState(loanAddress.state)} </SoftTypography>
                        </SoftBox>
                    ))
                )}
                </>
            )}
        </SoftBox>
    );
}