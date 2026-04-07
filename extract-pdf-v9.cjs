const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function main() {
    const buf = fs.readFileSync('rules.pdf');
    const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    const parser = new PDFParse(uint8);
    
    // Instead of load(), let's try to just get the text if it's already there
    // Or see if there's a static method.
    // Based on previous error, maybe I should use PDFParse.prototype methods.
    
    try {
        await parser.load();
        const text = parser.getText();
        if (text) {
            fs.writeFileSync('./public/kepco_rules.txt', text, 'utf8');
            console.log('SUCCESS:', text.length, 'chars');
        } else {
            console.log('No text found via getText()');
        }
    } catch(e) {
        console.error('Load failed:', e.message);
    }
}
main();
