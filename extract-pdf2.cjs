const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.join(__dirname, '배전선로이설업무기준개정전문(20차)(대외용).pdf');
const outputPath = path.join(__dirname, 'public', 'kepco_rules.txt');

async function main() {
  const buf = fs.readFileSync(pdfPath);
  const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const parser = new PDFParse(uint8);
  await parser.load();
  
  const info = parser.getInfo();
  const numPages = info.pages || info.numPages || 0;
  console.log('Pages:', numPages, 'Info:', JSON.stringify(info));
  
  let allText = '';
  for (let i = 1; i <= numPages; i++) {
    try {
      const pageText = parser.getPageText(i);
      if (pageText) allText += pageText + '\n\n';
    } catch(e) {
      console.error('Page', i, 'error:', e.message);
    }
  }
  
  fs.writeFileSync(outputPath, allText, 'utf8');
  console.log('SUCCESS:', allText.length, 'chars written');
  parser.destroy();
}

main().catch(e => console.error('FAIL:', e.message));
