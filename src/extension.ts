// extension.ts
import * as vscode from 'vscode';
import { FileItem } from './fileItem';
import { CodelessTreeDataProvider } from './codelessTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
    const treeDataProvider = new CodelessTreeDataProvider();
    const treeView = vscode.window.createTreeView('codelessExplorer', { 
        treeDataProvider: treeDataProvider 
    });

    let selectFileCommand = vscode.commands.registerCommand('codeless.selectFile', (item: FileItem) => {
        treeDataProvider.toggleSelection(item);
    });

    treeView.onDidChangeSelection(event => {
        if (event.selection.length > 0) {
            vscode.commands.executeCommand('codeless.selectFile', event.selection[0]);
        }
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