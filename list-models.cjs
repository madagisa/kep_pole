const https = require('https');
require('dotenv').config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`, (res) => {
  let data = '';
  res.on('data', (d) => {
    data += d;
  });
  res.on('end', () => {
    try {
        const json = JSON.parse(data);
        if(!json.models) {
             console.log("Error or no models format:", json);
             return;
        }
        json.models.forEach(m => {
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                console.log(m.name);
            }
        });
    } catch(e) {
        console.error(e);
    }
  });
});
