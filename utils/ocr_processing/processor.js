// ocr_processing/processor.js
import pkg1 from 'tesseract.js';
const { recognize } = pkg1;
import pkg2 from 'jimp';
const { read, RESIZE_BICUBIC, MIME_PNG } = pkg2;
import { basename } from 'path';


async function _preprocessForOcr(imagePath) {
    const image = await read(imagePath);
    image
        .scale(2, RESIZE_BICUBIC)
        .greyscale()
        .contrast(0.5);
    return image.getBufferAsync(MIME_PNG);
}


function parseDynamicText(text) {
    const result = {};
    const lines = text.split(/\r?\n/);

    for (let line of lines) {

        line = line.trim();
        if (!line) continue;


        const match = line.match(/^([^:=\-]+)\s*[:=\-]\s*(.+)$/);
        if (match) {
            let key = match[1].trim().toLowerCase().replace(/\s+/g, "_");
            let value = match[2].trim();


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

export function reqFormat(data) {
    let ans = {};

    ans.answers = { ...data };
    ans.missingFields = [];
    if (data['age'] == null) ans.missingFields.push('sleep');
    if (data['smoker'] == null) ans.missingFields.push('smoking');

    if (data['exercise'] == null) ans.missingFields.push('exercise');
    if (data['diet'] == null) ans.missingFields.push('diet');
    return ans;
}





export async function processImageToData(imagePath) {
    console.log(`-> Starting OCR process for: ${basename(imagePath)}`);

    try {
        const processedImageBuffer = await _preprocessForOcr(imagePath);

        const { data: { text, confidence } } = await recognize(
            processedImageBuffer,
            'eng',
            { logger: m => { if (m.status === 'recognizing text') { process.stdout.write(`\r   Recognizing... ${Math.round(m.progress * 100)}%`); } } }
        );
        process.stdout.write('\r   Recognition complete.              \n');

        if (!text || !text.trim()) {
            console.log("Warning: OCR did not detect any text.");
            return {};
        }

        console.log("-> OCR successful. Parsing text...");
        let structuredData = parseDynamicText(text);

        let finalFormat = reqFormat(structuredData)
        finalFormat.confidence = confidence / 100.0;
        structuredData = finalFormat;
        console.log("-> Parsing complete.", structuredData);
        return structuredData;

    } catch (error) {
        console.error("An unexpected error occurred during OCR processing:", error);
        return {};
    }
}

