
const fs = require('fs');
const path = require('path');
const bundleDir = "D:\\Projects\\ConductorDesigner\\.build\\sea";
const outputPath = "D:\\Projects\\ConductorDesigner\\.build\\sea-bundle.blob";

// Simulate SEA bundling by creating a frozen file system
const bundledFiles = {};

function scanDir(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      scanDir(path.join(dir, entry.name), prefix + entry.name + '/');
    } else {
      const filePath = path.join(dir, entry.name);
      const content = fs.readFileSync(filePath);
      bundledFiles[prefix + entry.name] = content;
    }
  }
}

scanDir(bundleDir);

// Write bundle as binary blob
const bundleBuffer = Buffer.from(JSON.stringify(bundledFiles));
fs.writeFileSync(outputPath, bundleBuffer);

console.log(`SEA Blob created: ${outputPath} (${bundleBuffer.length} bytes)`);
