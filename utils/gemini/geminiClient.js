// clients/geminiClient.js

import { configDotenv } from "dotenv";
// import API_URL from "../api.js";
// import fetch from 'node-fetch'; 
configDotenv();
const API_KEY = process.env.GOOGLE_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;


/**
 * A private, reusable function to call the Google Gemini API with retry logic.
 */
async function _callGeminiApi(systemPrompt, userInput, jsonSchema) {
    if (!API_URL) {
        console.error("ERROR: GOOGLE_API_KEY not found. Please check your .env file.");
        return null;
    }

    const payload = {
        contents: [{ parts: [{ text: userInput }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
        },
    };
    const headers = { "Content-Type": "application/json" };

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                if (response.status >= 500) { throw new Error(`Server Error: ${response.status}`); }
                const errorBody = await response.json();
                console.error("API Call Failed (Client Error):", errorBody);
                return null;
            }
            
            const responseData = await response.json();
            const content = responseData.candidates[0].content.parts[0].text;
            return JSON.parse(content);

        } catch (error) {
            if (attempt < 2) {
                const waitTime = Math.pow(2, attempt) * 1000;
                console.log(`API Error: ${error.message}. Retrying in ${waitTime / 1000}s...`);
                await new Promise(res => setTimeout(res, waitTime));
            } else {
                console.error("API Call Failed after multiple retries:", error);
                return null;
            }
        }
    }
}

/**
 * Calls the AI to get a comprehensive summary of every factor.
 */
export async function getRiskFactors(surveyData) {
    console.log("--- [AI Client] Preparing to get lifestyle summary... ---");

    // --- PROMPT -=-
    const systemPrompt = "You are a health data summarizer. For each lifestyle habit provided, identify the key factor and describe it in a clear, professional phrase (e.g., 'High sugar intake', 'Lack of physical activity', 'Moderate alcohol consumption'). You must summarize every category provided. Your response MUST be a single, valid JSON object with a  'risk_factors' key holding an array of strings, and another key confidence value between 0 and 1 telling how confident we are about this risk factors.";
    
    const jsonSchema = {
        type: "OBJECT",
        properties: { risk_factors: { type: "ARRAY", items: { type: "STRING" } }, confidence: { type: "NUMBER" }},
        required: ["risk_factors", "confidence"],
    };
    const userInputText = Object.entries(surveyData.answers).map(([key, value]) => `${key}: ${value}`).join('\n');

    const responseJson = await _callGeminiApi(systemPrompt, userInputText, jsonSchema);
    
    if (responseJson) {
        console.log("--- [AI Client] Successfully received factors! ---");
        console.log(responseJson);
        return responseJson.risk_factors || [];
    }
    console.log("--- [AI Client] Failed to get factors. ---");
    return [];
}


export async function getRiskClassification(riskFactors) {
    console.log("--- [AI Client] Preparing to classify risk... ---");

    const systemPrompt = `
    You are a health risk classifier. 
    Based on the provided risk factors, compute a simple NON-DIAGNOSTIC score (0–100), 
    assign a risk level (low, moderate, high), and return the rationale. 
    
    - "risk_level": one of "low", "moderate", "high"
    - "score": an integer 0-100
    - "rationale": array of the main risk factor strings
    Your response MUST be a single, valid JSON object.
    `;

    const jsonSchema = {
        type: "OBJECT",
        properties: {
            risk_level: { type: "STRING" },
            score: { type: "NUMBER" },
            rationale: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["risk_level", "score", "rationale"]
    };

    const userInputText = JSON.stringify({ risk_factors: riskFactors });

    const responseJson = await _callGeminiApi(systemPrompt, userInputText, jsonSchema);

    if (responseJson) {
        console.log("--- [AI Client] Successfully received risk classification! ---");
        return responseJson;
    }

    console.log("--- [AI Client] Failed to classify risk. ---");
    return { risk_level: "unknown", score: 0, rationale: [] };
}


/**
 * Takes a list of lifestyle summaries and generates detailed, encouraging recommendations.
 */
export async function getRecommendations(riskFactors) {
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
    const userInputText = `Please provide recommendations for the following lifestyle factors: ${riskFactors.rationale.join(', ')}`;
    
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

// export default { getRiskFactors, getRecommendations };

    