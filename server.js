// server.js
import express, { json } from 'express';
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load .env from root
dotenv.config({ path: path.resolve(__dirname, "./.env") });
import multer from 'multer';
import { existsSync, mkdirSync, unlink } from 'fs';
// import path from 'path';
// import { processImageToData } from './ocr_processing/processor.js';
// import { extractFactorsWithAi, getRecommendationsWithAi } from './analysis/analyzer.js';
// import { profile } from 'console';
import profileRouter from './router/profile.routes.js';





const app = express();
const port = 3000;

// --- Multer Configuration for File Uploads ---
// This sets up a temporary storage location for uploaded images.


app.use(json());

// --- API Endpoint ---
// Listens for POST requests at http://localhost:3000/analyze
// app.post('/analyze', upload.single('surveyImage'), async (req, res) => {
//     console.log('Received request for /analyze');
    
//     if (!req.file) {
//         return res.status(400).json({ error: 'No image file uploaded. Please use the "surveyImage" field.' });
//     }

//     const imagePath = req.file.path;
//     const inputText = req.body;

//     try {
//         // --- STAGE 1: OCR ---
//         const surveyData = await processImageToData(imagePath);
//         if (!surveyData || Object.keys(surveyData).length === 0) {
//             return res.status(500).json({ error: 'OCR failed to extract data from the image.' });
//         }

//        if(!inputText && !surveyData ){
//         return res.status(400).json({ error: 'No text input provided in the request body.' });
//        } 

       
//         // --- STAGE 2: AI Factor Extraction ---
//         const riskFactors = await extractFactorsWithAi(surveyData);
//         if (!riskFactors || riskFactors.length === 0) {
//             return res.status(500).json({ error: 'AI analysis did not return any risk factors.' });
//         }

//         // --- STAGE 3: AI Recommendation Generation ---
//         const recommendations = await getRecommendationsWithAi(riskFactors);
//         if (!recommendations || Object.keys(recommendations).length === 0) {
//             return res.status(500).json({ error: 'AI analysis did not return any recommendations.' });
//         }

//         // --- FINAL REPORT ---
//         const finalReport = {
//             analyzedData: surveyData,
//             identifiedFactors: riskFactors,
//             personalizedRecommendations: recommendations
//         };

//         res.status(200).json(finalReport);

//     } catch (error) {
//         console.error("An error occurred in the /analyze endpoint:", error);
//         res.status(500).json({ error: 'An internal server error occurred.' });
//     } finally {
//         // Cleanup: Delete the temporary uploaded file
//         unlink(imagePath, (err) => {
//             if (err) console.error("Error deleting temp file:", err);
//         });
//     }
// });
app.use('/api',profileRouter);
app.use('*',(req,res)=>{
    res.status(404).json({error:'unknown url'});
})

// Start the server
app.listen(port, () => {
    console.log(`✅ Health profiler server is running at http://localhost:${port}`);
    console.log('To test, send a POST request with a file upload to http://localhost:3000/api/analyze');
});
// ```

// ### Next Steps

// 1.  **Install Express & Multer:** Open your terminal in the `Factor_risking` folder and run:
//     ```bash
//     npm install express multer
//     ```
// 2.  **Run the Server:** Start your web server with the command:
//     ```bash
//     node server.js
    
