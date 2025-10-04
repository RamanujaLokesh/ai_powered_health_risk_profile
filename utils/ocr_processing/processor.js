// ocr_processing/processor.js
import pkg1 from 'tesseract.js';
const { recognize } = pkg1;
import pkg2 from 'jimp';
const { read, RESIZE_BICUBIC, MIME_PNG } = pkg2;
import { basename } from 'path';

/**
 * A helper function to clean an image for better OCR results.
 * @param {string} imagePath - The path to the image file.
 * @returns {Promise<Buffer>} - A buffer of the processed image.
 */
async function _preprocessForOcr(imagePath) {
    const image = await read(imagePath);
    
    // Upscale, convert to grayscale, and apply contrast
    image
        .scale(2, RESIZE_BICUBIC)
        .greyscale()
        .contrast(0.5);
    
    return image.getBufferAsync(MIME_PNG);
}

/**
 * A helper function to parse raw text into a structured object.
 * @param {string} text - The raw text from Tesseract.
 * @returns {object} - The structured survey data.
 */
/**
 * Convert OCR text into an object with dynamic fields.
 * Handles formats like:
 *   Key: Value
 *   Key = Value
 *   Key - Value
 *
 * @param {string} text - Raw OCR text
 * @returns {object} Parsed object with dynamic keys
 */
function parseDynamicText(text) {
    const result = {};
    
    // Split text into lines
    const lines = text.split(/\r?\n/);

    for (let line of lines) {
        // Trim whitespace
        line = line.trim();
        if (!line) continue;

        // Match "key : value" or "key = value" or "key - value"
        const match = line.match(/^([^:=\-]+)\s*[:=\-]\s*(.+)$/);
        if (match) {
            let key = match[1].trim().toLowerCase().replace(/\s+/g, "_"); // normalize
            let value = match[2].trim();

            // Optional: type conversion
            if (/^\d+$/.test(value)) {
                value = parseInt(value, 10);
            } else if (/^(true|false|yes|no)$/i.test(value)) {
                value = /^(true|yes)$/i.test(value);
            }

            result[key] = value;
        }
    }

    return result;
}

export function reqFormat(data){
    let ans = {};
    // ans.answers = [];
    ans.answers = {...data};
    ans.missingFields = [];
    if(data['age']==null)ans.missingFields.push('sleep');
    if(data['smoker']==null)ans.missingFields.push('smoking');
    // if(data['a']==null)ans.missingFields.push('alcohol');
    if(data['exercise']==null)ans.missingFields.push('exercise');
    if(data['diet']==null)ans.missingFields.push('diet');
    return ans;
}




/**
 * Main function for this module. Takes an image path and returns a
 * structured object of the survey answers.
 * @param {string} imagePath - The full path to the image.
 * @returns {Promise<object>} - The structured survey data.
 */
export async function processImageToData(imagePath) {
    console.log(`-> Starting OCR process for: ${basename(imagePath)}`);
    
    try {
        const processedImageBuffer = await _preprocessForOcr(imagePath);

        const { data: { text, confidence } } = await recognize(
            processedImageBuffer,
            'eng',
            { logger: m => { if(m.status === 'recognizing text') { process.stdout.write(`\r   Recognizing... ${Math.round(m.progress * 100)}%`); } } }
        );
        process.stdout.write('\r   Recognition complete.              \n'); // Clear the line

        if (!text || !text.trim()) {
            console.log("Warning: OCR did not detect any text.");
            return {};
        }

        console.log("-> OCR successful. Parsing text...");
        let structuredData = parseDynamicText(text);
        // let structuredData = text;
        // structuredData.confidence = confidence;
       let finalFormat = reqFormat(structuredData)
       finalFormat.confidence = confidence/100.0;
       structuredData = finalFormat;
        console.log("-> Parsing complete.", structuredData);
        return structuredData;

    } catch (error) {
        console.error("An unexpected error occurred during OCR processing:", error);
        return {};
    }
}

