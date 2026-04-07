const fs = require('fs');
const pdf = require('pdf-parse');

async function main() {
  const buf = fs.readFileSync('rules.pdf');
  try {
    const data = await pdf(buf);
    fs.writeFileSync('./public/kepco_rules.txt', data.text, 'utf8');
    console.log('Successfully wrote', data.text.length, 'chars');
  } catch (e) {
    console.log('Main pdf-parse failed, trying fallback...');
    // If pdf-parse version 2.4.x or other, it might export differently
    const pdfMod = require('pdf-parse');
    if (pdfMod.default) {
        pdfMod.default(buf).then(d => {
            fs.writeFileSync('./public/kepco_rules.txt', d.text, 'utf8');
            console.log('Fallback wrote', d.text.length, 'chars');
        }).catch(e2 => console.error('All failed', e2));
    } else {
        console.error('All failed, module type:', typeof pdfMod);
    }
  }
}

main();
