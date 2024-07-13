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

    let processFilesCommand = vscode.commands.registerCommand('codeless.processFiles', async () => {
        const selectedFiles = treeDataProvider.getSelectedFiles();
        if (instruction) {
            const content = await Promise.all(selectedFiles.map(async file => {
                const document = await vscode.workspace.openTextDocument(file.path);
                return `\`\`\`${file.name}\n${document.getText()}\n\`\`\``;
            }));
            const prompt = content.join('\n\n');
            const finalPrompt = `${content.join('\n\n')}\n\nPlease take the above files into consideration and try to follow the instruction. **Only** write out the files that need to be modified and make sure to **always** write out the complete file (if it has modifications). Also, write the file(s) content out in the same format.\n\nInstruction:\n${instruction}`;
            await vscode.env.clipboard.writeText(finalPrompt);
            vscode.window.showInformationMessage(`Prompt copied to clipboard:\n${finalPrompt}`);
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