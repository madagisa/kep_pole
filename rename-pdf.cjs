const fs = require('fs');
const files = fs.readdirSync('.');
const pdfFile = files.find(f => f.endsWith('.pdf'));
if (pdfFile) {
  fs.renameSync(pdfFile, 'rules.pdf');
  console.log('Renamed', pdfFile, 'to rules.pdf');
} else {
  console.log('No PDF found');
}
