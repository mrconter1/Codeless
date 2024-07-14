const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

async function buildAndInstall() {
    try {
        // Compile TypeScript
        console.log('Compiling TypeScript...');
        await runCommand('npm run compile');

        // Package the extension
        console.log('Packaging extension...');
        await runCommand('vsce package --no-yarn');

        // Find the latest .vsix file
        const files = fs.readdirSync('.');
        const vsixFiles = files.filter(file => path.extname(file) === '.vsix');
        const latestVsix = vsixFiles.sort((a, b) => {
            return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
        })[0];

        if (!latestVsix) {
            throw new Error('No .vsix file found');
        }

        // Install the extension
        console.log(`Installing ${latestVsix}...`);
        await runCommand(`code --install-extension ${latestVsix}`);

        console.log('Extension built and installed successfully. Please reload VS Code.');
    } catch (error) {
        console.error('An error occurred:', error.message);
        process.exit(1);
    }
}

buildAndInstall();