import { useState } from "react";
import * as openAiApi from "../api/openai";

export default function useOpenAI() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyseLoanTerms = async (loanDetails) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await openAiApi.analyseLoanTerms(loanDetails);
            setIsLoading(false);
            return result;
        } catch (error) { 
            setError(error.message);
            console.error("Error analysing loan terms:", error);
            setIsLoading(false);
            throw error; 
        }
    }

    const analyseProposal = async (proposalDetails) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await openAiApi.analyseProposal(proposalDetails);
            setIsLoading(false);
            return result;
        } catch (error) { 
            setError(error.message);
            console.error("Error analysing proposal:", error);
            setIsLoading(false);
            throw error; 
        }
    }
    
    const askLoanQuestion = async (question) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await openAiApi.askLoanQuestion(question);
            setIsLoading(false);
            return result;
        } catch (error) { 
            setError(error.message);
            console.error("Error asking loan question:", error);
            setIsLoading(false);
            throw error; 
        }
    }

    const helpMakeProposal = async (proposalDetails) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await openAiApi.helpMakeProposal(proposalDetails);
            setIsLoading(false);
            return result;
        } catch (error) { 
            setError(error.message);
            console.error("Error making proposal:", error);
            setIsLoading(false);
            throw error; 
        }
    }

    const resetError = () => {
        setError(null);
    };

    return {
        isLoading,
        error,
        analyseLoanTerms,
        askLoanQuestion,
        resetError,
        analyseProposal,
        helpMakeProposal,
    };
};