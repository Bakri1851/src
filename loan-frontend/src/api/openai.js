import ApiConfig from "../constants/ApiConfig";

export const generateCompletion = async (prompt, options = {}) => {
    try {
        console.log("Sending request to OpenAI API...");
        console.log("API Key exists:", !!ApiConfig.openaiApiKey);
        
        const response = await fetch(`${ApiConfig.openaiApiUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ApiConfig.openaiApiKey}`,
            },
            body: JSON.stringify({
                model: options.model || ApiConfig.defaultModel,
                messages: [{ role: "user", content: prompt }],
                max_tokens: options.maxTokens || ApiConfig.defaultMaxTokens,
                temperature: options.temperature || ApiConfig.defaultTemperature,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("API Response:", response.status, errorData);
            throw new Error(`API request failed with status ${response.status}: ${errorData}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API error:", error);
        throw error;
    }
}

export const analyseLoanTerms = async (loanDetails) => {
    const config = ApiConfig.analysisTypes.loanTerms;

    const prompt = `Analyse these smart contract loan terms provide insights:
    - Repayment Amount: ${loanDetails.repaymentAmount || "N/A"}
    - Loan Amount: ${loanDetails.loanAmount}
    - Fixed Rate: ${loanDetails.fixedRate}
    - Floating Rate : ${loanDetails.floatingRate || "N/A"}
    - Repayment deadline : ${loanDetails.repayByTimestamp}
    - Current Loan Status: ${loanDetails.state}

    Provide:
    1. An evaluation of these terms
    2. Recommendation on whether a fixed or floating rate is more beneficial
    3. Any potential risks or benefits associated with these terms
    4. Should the loan be paid off early or not?
    5. Recommend actions for borrower or lender based on the analysis.
    6. Any other relevant information or insights that could be useful for the borrower or lender.
    7. Should the lender liquidate the loan or not if possible

    Format the response in a clear and structured manner, using bullet points or numbered lists where appropriate.  
    Fixed rate stays same throughout the loan period, while floating rate can change based on market conditions.  
    If the repayment amount is not specified, the lender is the one calling the function so no need to talk about the repayment amount.

    `;

    return generateCompletion(prompt, config);
}

export const analyseProposal = async (proposalDetails) => {
    const config = ApiConfig.analysisTypes.marketConditions;

    const prompt = `Analyse the following blockchain proposal and provide insights:
    - Loan Amount: ${proposalDetails.loanAmount} ETH
    - Fee Amount: ${proposalDetails.feeAmount} ETH
    - Collateral Amount: ${proposalDetails.ethCollateralAmount} ETH
    - Repay By: ${proposalDetails.repayByTimestamp}
    - Fixed Rate: ${proposalDetails.fixedRate}
    - Floating Rate: ${proposalDetails.floatingRate}

    Provide:
    1. An evaluation of these terms and fairness of the proposal
    2. Analysis of the collateral loan ratio and its sufficiency
    3. Assessment of interest rates compared to market conditions
    4. Potential risks for lenders accepting this proposal
    5. Recommendations for potential lenders considering this proposal
    6. Any red flags or particularly favorable terms to note

    Format the response in a clear and structured way, using bullet points or numbered lists where appropriate.
    Fixed rate stays same throughout the loan period, while floating rate can change based on market conditions.  

    `;

    return generateCompletion(prompt, config);  
}

export const helpMakeProposal = async (proposalDetails) => {
    const config = ApiConfig.analysisTypes.loanTerms;

    const prompt = `As a blockchain loan expert, help optimise this loan proposal:
    - Loan Amount: ${proposalDetails.loanAmount || "Not specified"} ETH
    - Fee Amount: ${proposalDetails.feeAmount || "Not specified"} ETH
    - Collateral Amount: ${proposalDetails.collateral || "Not specified"} ETH
    - Repay By: ${proposalDetails.repayByDateString || "Not specified"}
    - Fixed Rate: ${proposalDetails.fixedRate || "Not specified"}
    - Floating Rate: ${proposalDetails.floatingRate || "Not specified"}

    Provide:
    1. Suggestions for improving these loan terms to be fair and attractive
    2. Recommended collateral-to-loan ratio based on current market conditions
    3. Advice on appropriate fee structure
    4. Optimal repayment timeframe
    5. Explanation of fixed vs floating rate choice for this particular proposal
    6. Any other recommendations to make this proposal more likely to be accepted

    If any values are missing, provide general advice for that parameter.
    Format the response in a clear and structured way, using bullet points or numbered lists where appropriate.
    The rates cannot be adjusted and are deteremined by the market so keep that in mind.
    Fixed rate stays same throughout the loan period, while floating rate can change based on market conditions. 
    You are talking to the borrower and not the lender so try to make the proposal as attractive as possible for the lender but also beneficial to the borrower. 

    `;

    return generateCompletion(prompt, config);
}


export const askLoanQuestion = async (question) => {
    const config = ApiConfig.analysisTypes.loanTerms;

    const prompt = `As a blockchain loan expert, answer the following question :
    ${question}
    
    Provide a clear, concise answer based on best practices in DeFi and blockchain lending.
    `;

    return generateCompletion(prompt, config);
}
