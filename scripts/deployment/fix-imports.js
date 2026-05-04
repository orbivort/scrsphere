const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix relative imports without extensions
  // Match import/export statements with relative paths
  content = content.replace(/from\s+(['"])(\.\.?\/[^'"]+)\1/g, (match, quote, importPath) => {
    // Skip if already has extension
    if (/\.(js|ts|json)$/.test(importPath)) return match;

    // Check if it's a directory with index.js
    const fullPath = path.join(path.dirname(filePath), importPath);
    const indexPath = fullPath + '/index.js';

    if (fs.existsSync(indexPath)) {
      return `from ${quote}${importPath}/index.js${quote}`;
    }

    // Otherwise add .js extension
    return `from ${quote}${importPath}.js${quote}`;
  });

  // Fix dynamic imports
  content = content.replace(
    /import\s*\(\s*(['"])(\.\.?\/[^'"]+)\1\s*\)/g,
    (match, quote, importPath) => {
      if (/\.(js|ts|json)$/.test(importPath)) return match;

      const fullPath = path.join(path.dirname(filePath), importPath);
      const indexPath = fullPath + '/index.js';

      if (fs.existsSync(indexPath)) {
        return `import(${quote}${importPath}/index.js${quote})`;
      }

      return `import(${quote}${importPath}.js${quote})`;
    }
  );

  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

walkDir('.');
console.log('Import extensions fixed successfully');
