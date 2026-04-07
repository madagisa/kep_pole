const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '배전선로이설업무기준개정전문(20차)(대외용).pdf');
const outputPath = path.join(__dirname, 'public', 'kepco_rules.txt');

async function main() {
  if (!fs.existsSync(pdfPath)) {
    console.error('File NOT found:', pdfPath);
    return;
  }
  
  const dataBuffer = fs.readFileSync(pdfPath);
  try {
    const data = await pdf(dataBuffer);
    fs.writeFileSync(outputPath, data.text, 'utf8');
    console.log(`SUCCESS: Extracted ${data.numpages} pages (${data.text.length} chars)`);
  } catch (e) {
    console.error('PDF Parse Error:', e);
  }
}

main();
