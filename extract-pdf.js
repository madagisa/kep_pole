import fs from 'fs';
import pdfParse from 'pdf-parse';

const pdfPath = './배전선로이설업무기준개정전문(20차)(대외용).pdf';
const outputPath = './public/kepco_rules.txt';

async function extractText() {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        
        fs.writeFileSync(outputPath, data.text);
        console.log(`Successfully extracted ${data.numpages} pages to ${outputPath}`);
    } catch (err) {
        console.error("Error extracting PDF:", err);
    }
}

extractText();
