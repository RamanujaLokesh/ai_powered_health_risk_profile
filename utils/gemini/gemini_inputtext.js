export const geminiInputText= async (text)=>{
    console.log(" converting text to json format");

    const systemPrompt = `you have to read this text ${text} and convert it in to json format setting keys as age, smoker, exercise, alcohol, diet, sleep.
    If any key is missing in the text, set its value to normal standard value.` 

    
}


async function getRecommendations(riskFactors) {
    console.log("\n--- [AI Client] Preparing to get recommendations... ---");

    // ---  PROMPT ---
    const systemPrompt = "You are a helpful and encouraging health advisor. For each lifestyle factor provided, generate one simple, actionable, and non-diagnostic recommendation with a supportive tone. Your response MUST be a single, valid JSON object. The top-level key must be 'recommendations', holding a list of objects, where each object has two keys: 'factor' and 'recommendation'.";
    
    const jsonSchema = {
        type: "OBJECT",
        properties: {
            recommendations: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: { factor: { type: "STRING" }, recommendation: { type: "STRING" } },
                    required: ["factor", "recommendation"],
                },
            },
        },
        required: ["recommendations"],
    };
    const userInputText = `Please provide recommendations for the following lifestyle factors: ${riskFactors.join(', ')}`;
    
    const responseJson = await _callGeminiApi(systemPrompt, userInputText, jsonSchema);
    
    if (responseJson && responseJson.recommendations) {
        console.log("--- [AI Client] Successfully received recommendations! ---");
        return responseJson.recommendations.reduce((acc, item) => {
            acc[item.factor] = item.recommendation;
            return acc;
        }, {});
    }
    console.log("--- [AI Client] Failed to get recommendations. ---");
    return {};
}