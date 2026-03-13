const fs = require('fs');
const path = require('path');

function fixSvgsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We only want to add aria-hidden to decorative svgs.
    // So we look for <svg tags that don't already have aria-hidden, role, or aria-label.
    let modified = false;
    content = content.replace(/<svg\s+([^>]*?)>/g, (match, attrs) => {
        if (attrs.includes('aria-hidden') || attrs.includes('role=') || attrs.includes('aria-label') || attrs.includes('aria-labelledby')) {
            return match;
        }
        modified = true;
        // add aria-hidden="true" right after <svg
        return `<svg aria-hidden="true" ${attrs}>`;
    });
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            // skip node_modules
            if (entry.name !== 'node_modules' && entry.name !== '.next') {
                processDirectory(fullPath);
            }
        } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
            fixSvgsInFile(fullPath);
        }
    }
}

const srcDir = path.resolve('c:/Users/HP/Desktop/reuse/frontend/src');
console.log(`Processing directory: ${srcDir}`);
processDirectory(srcDir);
console.log('Done.');
