import * as vscode from 'vscode';
import { CodelessTreeDataProvider } from './codelessTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
    const treeDataProvider = new CodelessTreeDataProvider();
    vscode.window.createTreeView('codelessExplorer', { 
        treeDataProvider: treeDataProvider 
    });

    let processFilesCommand = vscode.commands.registerCommand('codeless.processFiles', () => {
        vscode.window.showInputBox({ prompt: 'Enter instructions for processing files' })
            .then(instruction => {
                if (instruction) {
                    vscode.window.showInformationMessage(`Processing files with instruction: ${instruction}`);
                    // Implement your file processing logic here
                }
            });
    });

    let refreshFileListCommand = vscode.commands.registerCommand('codeless.refreshFileList', () => {
        treeDataProvider.refresh();
    });

    context.subscriptions.push(processFilesCommand, refreshFileListCommand);
}

export function deactivate() {}