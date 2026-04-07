const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function main() {
  const buf = fs.readFileSync('rules.pdf');
  const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  
  try {
    const parser = new PDFParse(uint8);
    // Since it's a class-based version, let's see how to extract all text
    await parser.load();
    const info = parser.getInfo();
    const numPages = info.numPages || 0;
    console.log('Pages detected:', numPages);
    
    let fullText = '';
    for(let i=1; i<=numPages; i++) {
        try {
            const pageText = parser.getPageText(i);
            if(pageText) fullText += pageText + '\n';
        } catch(e) {
            console.error('Error on page', i, e.message);
        }
    }
    
    if (fullText.length === 0) {
        // Try getText() if getPageText fails
        fullText = parser.getText() || '';
    }

    fs.writeFileSync('./public/kepco_rules.txt', fullText, 'utf8');
    console.log('SUCCESS: wrote', fullText.length, 'chars');
    parser.destroy();
  } catch (e) {
    console.error('PDFParse Class Error:', e);
  }
}

main();
