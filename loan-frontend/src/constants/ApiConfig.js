

const ApiConfig = {
    openaiApiKey: process.env.REACT_APP_OPENAI_API_KEY,
    openaiApiUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    defaultMaxTokens: 1000,
    defaultTemperature: 0.7,
    


    analysisTypes: {
        loanTerms:{
            model: "gpt-4o",
            maxTokens: 800,
            temperature: 0.5,
        },
        marketConditions:{
            model: "gpt-4o",
            maxTokens: 1000,
            temperature: 0.7,
        },
    /*    riskAssessment:{
            model: "gpt-4o",
            maxTokens: 1200,
            temperature: 0.3,
        }, */
    }
}


export default ApiConfig;