const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Simplified regex to pick the HEAD version (between <<<<<<< HEAD and =======)
    // and remove the other version (between ======= and >>>>>>>)
    const regex = /<<<<<<< HEAD([\s\S]*?)=======[\s\S]*?>>>>>>> [a-z0-9]+/g;
    const cleanedContent = content.replace(regex, '$1');
    
    if (content !== cleanedContent) {
        fs.writeFileSync(filePath, cleanedContent, 'utf8');
        console.log(`Cleaned: ${filePath}`);
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            cleanFile(fullPath);
        }
    }
}

const srcPath = process.argv[2] || './src';
walk(srcPath);
