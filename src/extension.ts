// extension.ts
import * as vscode from 'vscode';
import { CodelessTreeDataProvider } from './codelessTreeDataProvider';
import { FileItem } from './fileItem';

export function activate(context: vscode.ExtensionContext) {
    const treeDataProvider = new CodelessTreeDataProvider();
    const treeView = vscode.window.createTreeView('codelessExplorer', { 
        treeDataProvider: treeDataProvider 
    });

    let selectFileCommand = vscode.commands.registerCommand('codeless.selectFile', (item: FileItem) => {
        treeDataProvider.toggleSelection(item);
    });

    let processFilesCommand = vscode.commands.registerCommand('codeless.processFiles', () => {
        const selectedFiles = treeDataProvider.getSelectedFiles();
        vscode.window.showInputBox({ prompt: 'Enter instructions for processing files' })
            .then(instruction => {
                if (instruction) {
                    vscode.window.showInformationMessage(`Processing ${selectedFiles.length} files with instruction: ${instruction}`);
                    // Implement your file processing logic here
                }
            });
    });

    let refreshFileListCommand = vscode.commands.registerCommand('codeless.refreshFileList', () => {
        treeDataProvider.refresh();
    });

    context.subscriptions.push(selectFileCommand, processFilesCommand, refreshFileListCommand);
}

export function deactivate() {}