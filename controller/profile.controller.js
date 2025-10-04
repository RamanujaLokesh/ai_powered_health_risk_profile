import { getRiskFactors, getRecommendations, getRiskClassification } from '../utils/gemini/geminiClient.js';
import {processImageToData,  reqFormat }from '../utils/ocr_processing/processor.js';
import { unlink } from 'fs';


const gaurdrail = (data)=>{

    if(data.missingFields.length>2)return false;
    return true;
}

export const analyze  = async(req,res)=>{
    console.log('Received request for /analyze');
    
    if (!req.file&&!req.body) {
        return res.status(400).json({ error: 'No image file uploaded. Please use the "surveyImage" field.' });
    }
let surveyData = req.body;
surveyData.confidence = 1.0;
surveyData = reqFormat(surveyData);

    // const inputText = req.body;
    // let inputText;
    // ----- first stage of pipeline ------
    if(req.file){
        const imagePath = req.file.path;
        try {
             surveyData = await processImageToData(imagePath);
                    if (!surveyData || Object.keys(surveyData).length === 0) {
                        return res.status(500).json({ error: 'OCR failed to extract data from the image.' });
                    }
            
        } catch (error) {
             console.error("An error occurred in the /analyze endpoint:", error);
        res.status(500).json({ error: 'An internal server error occurred.' });
        }finally{
            unlink(imagePath, (err) => {
                if (err) console.error("Error deleting temp file:", err);
            });
        }
    } 
    console.log("Output of STAGE 1 of pipeline:\n\n",surveyData);
    
    
    
    const gaurdrailResult =  gaurdrail(surveyData);
    if(!gaurdrailResult){
        console.log(gaurdrailResult)
        return res.status(400).json({status:"incomplete_profile",reason:">50% fields missing of age, smoking, exercise, diet"});

    }

        // --- STAGE 2: AI Factor Extraction ---
        const riskFactors = await getRiskFactors(surveyData);
        if (riskFactors==null) {
            return res.status(500).json({ error: 'AI analysis did not return any risk factors.' });
        }
        console.log("Output of STAGE 2 of pipeline:\n\n",riskFactors)




        // --- STAGE 3: Risk classification ---

const riskClassification = await getRiskClassification(riskFactors);
console.log("Output of STAGE 3 of pipeline:\n\n",riskClassification)

if (riskClassification==null) {
    

    return res.status(500).json({ error: 'AI analysis did not return any risk classification.' })

}

        // --- STAGE 4: AI Recommendation Generation ---
        const recommendations = await  getRecommendations(riskClassification);
        console.log("Output of STAGE 4 of pipeline:\n\n",recommendations)

        if (!recommendations || Object.keys(recommendations).length === 0) {
            return res.status(500).json({ error: 'AI analysis did not return any recommendations.' });
        }

        // --- FINAL REPORT ---
        const finalReport = {
           // analyzedData: surveyData,
            Risk_level:riskClassification.risk_level,
            Factors: riskFactors,
            // riskClassification: riskClassification,
            personalizedRecommendations: recommendations,
            status:"ok"
        };
        console.log("final report:\n\n",finalReport);


        res.status(200).json(finalReport);

}