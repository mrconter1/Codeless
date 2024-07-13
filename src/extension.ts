import * as vscode from 'vscode';
import { CodelessTreeDataProvider } from './codelessTreeDataProvider';
import { CodelessViewProvider } from './codelessViewProvider';

export function activate(context: vscode.ExtensionContext) {
    const treeDataProvider = new CodelessTreeDataProvider();
    const viewProvider = new CodelessViewProvider(context.extensionUri, treeDataProvider);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CodelessViewProvider.viewType, viewProvider)
    );

    let instruction = '';

    let toggleFileCommand = vscode.commands.registerCommand('codeless.toggleFile', (path: string) => {
        treeDataProvider.toggleSelection(path);
    });

    let updateInstructionCommand = vscode.commands.registerCommand('codeless.updateInstruction', (value: string) => {
        instruction = value;
    });

    let processFilesCommand = vscode.commands.registerCommand('codeless.processFiles', () => {
        const selectedFiles = treeDataProvider.getSelectedFiles();
        if (instruction) {
            vscode.window.showInformationMessage(`Processing ${selectedFiles.length} files with instruction: ${instruction}`);
            // Implement your file processing logic here
        } else {
            vscode.window.showWarningMessage("Please enter an instruction before processing files.");
        }
    });

    let refreshFileListCommand = vscode.commands.registerCommand('codeless.refreshFileList', () => {
        treeDataProvider.refresh();
    });

    context.subscriptions.push(toggleFileCommand, updateInstructionCommand, processFilesCommand, refreshFileListCommand);
}

export function deactivate() {}