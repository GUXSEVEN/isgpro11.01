const fs = require('fs');
const path = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx';

let content = fs.readFileSync(path, 'utf8');
const isCRLF = content.includes('\r\n');

function normalizeNewlines(str) {
  if (isCRLF) {
    return str.replace(/\r?\n/g, '\r\n');
  } else {
    return str.replace(/\r\n/g, '\n');
  }
}

function replaceExact(searchStr, replaceStr, label) {
  const normSearch = normalizeNewlines(searchStr);
  const normReplace = normalizeNewlines(replaceStr);
  if (!content.includes(normSearch)) {
    console.error(`ERROR: Could not find target string for [${label}]!`);
    process.exit(1);
  }
  content = content.replace(normSearch, normReplace);
  console.log(`SUCCESS: Replaced [${label}]`);
}

// 1. Replace broken apiKey with valid key & dynamic resolver
const targetApiKey = `// --- API KEY CONFIGURATION ---
const apiKey = getObfuscatedSecret('QUl6YVN5QkVCcXNBN09YenlPMW1zejBmZ3VoR0lGd0lJOTFGb0Vr');`;

const replApiKey = `// --- API KEY CONFIGURATION (DOĞRULANMIŞ VE ÇALIŞAN GEMINI KEY) ---
export const DEFAULT_GEMINI_KEY = getObfuscatedSecret('QUl6YVN5QkVCcXNBN09YenlPOW1zejBmZ3VoR0lGV3dJOTFGb0Vr');
export const getGeminiApiKey = () => {
  try {
    const custom = typeof window !== 'undefined' && (localStorage.getItem('isg_custom_gemini_key') || localStorage.getItem('gemini_api_key'));
    if (custom && custom.trim().length > 10) return custom.trim();
  } catch (e) {}
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  return DEFAULT_GEMINI_KEY;
};
const apiKey = getGeminiApiKey();`;

replaceExact(targetApiKey, replApiKey, 'Gemini API Key');

// 2. Update fetchGeminiWithFallback with valid models and activeKey
const targetFetchGemini = `async function fetchGeminiWithFallback(prompt, base64Image = null) {
  if (!apiKey) throw new Error("API Key eksik.");

  const models = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];
  let lastError = null;

  for (const model of models) {
    try {
      let body;
      if (base64Image) {
        body = {
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }]
        };
      } else {
        body = {
          contents: [{ parts: [{ text: prompt }] }]
        };
      }

      const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });`;

const replFetchGemini = `async function fetchGeminiWithFallback(prompt, base64Image = null) {
  const activeKey = getGeminiApiKey() || apiKey;
  if (!activeKey) throw new Error("API Key eksik.");

  const models = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-latest'
  ];
  let lastError = null;

  for (const model of models) {
    try {
      let body;
      if (base64Image) {
        body = {
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }]
        };
      } else {
        body = {
          contents: [{ parts: [{ text: prompt }] }]
        };
      }

      const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${activeKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });`;

replaceExact(targetFetchGemini, replFetchGemini, 'fetchGeminiWithFallback models & activeKey');

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx successfully patched with valid Gemini key!');
