import fs from 'fs';
import path from 'path';

const appJsxPath = 'C:\\Users\\İBRAHİM\\Desktop\\isg-projesi - Copy\\src\\App.jsx';
let content = fs.readFileSync(appJsxPath, 'utf8').replace(/\r\n/g, '\n');

const search = '    const triggerSuccess = async (incomingLicenseKey, incomingPlan) => {';
const replace = '    const triggerSuccess = async (incomingLicenseKey, incomingPlan, explicitUsername = null) => {';

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync(appJsxPath, content, 'utf8');
  console.log('✓ triggerSuccess signature updated with explicitUsername.');
} else {
  console.log('Already updated or search not found.');
}
