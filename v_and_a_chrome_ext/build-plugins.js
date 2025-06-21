const fs = require('fs');
const path = require('path');

// Read all plugin files and concatenate them
const pluginsDir = path.join(__dirname, 'assets/plugins');
const outputFile = path.join(__dirname, 'cole/js/plugins.js');

// Get all .js files from plugins directory
const pluginFiles = fs.readdirSync(pluginsDir)
  .filter(file => file.endsWith('.js'))
  .sort(); // Sort to ensure consistent order

console.log('Plugin files found:', pluginFiles);

// Concatenate all plugin files
let concatenatedContent = '';
pluginFiles.forEach(file => {
  const filePath = path.join(pluginsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  concatenatedContent += content + '\n';
  console.log(`Added: ${file}`);
});

// Write the concatenated content
fs.writeFileSync(outputFile, concatenatedContent);
console.log(`Plugins concatenated to: ${outputFile}`); 