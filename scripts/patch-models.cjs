const fs = require('fs');
const path = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx';

let content = fs.readFileSync(path, 'utf8');

const oldModels = `  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-flash-latest'
  ];`;

const newModels = `  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ];`;

content = content.replace(oldModels, newModels);

const oldFetchModels = `  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-flash-latest'
  ];`;

content = content.replace(oldFetchModels, newModels);

fs.writeFileSync(path, content, 'utf8');
console.log('Candidate models updated in App.jsx!');
