const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, '배전선로이설업무기준개정전문(20차)(대외용).pdf');
const outputPath = path.join(__dirname, 'public', 'kepco_rules.txt');

async function main() {
  // Try to find the function in common places
  let pdf;
  try {
    const mod = require('pdf-parse');
    if (typeof mod === 'function') pdf = mod;
    else if (typeof mod.default === 'function') pdf = mod.default;
    else if (typeof mod.PDFParse === 'function') {
        // Handle it via class if needed, but let's try direct lib import
        pdf = require('pdf-parse/lib/pdf-parse.js');
    }
  } catch (e) {
    console.log('Main import failed, trying deep import...');
    try {
        pdf = require('pdf-parse/lib/pdf-parse.js');
    } catch(e2) {
        console.error('All imports failed');
        return;
    }
  }

  if (typeof pdf !== 'function') {
    console.error('Could not find pdf function. Type of mod:', typeof require('pdf-parse'));
    return;
  }

  const dataBuffer = fs.readFileSync(pdfPath);
  pdf(dataBuffer).then(data => {
    fs.writeFileSync(outputPath, data.text, 'utf8');
    console.log(`SUCCESS: ${data.numpages} pages, ${data.text.length} chars`);
  }).catch(err => {
    console.error('Final Parse Error:', err);
  });
}

main();
