import * as vscode from 'vscode';
import OpenAI from 'openai'; // Import OpenAI
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
            const finalPrompt = `${content.join('\n\n')}\n\nPlease take the above files into consideration and try to follow the instruction. **Only** write out the files that need to be modified and make sure to **always** write out the complete file (if it has modifications). Also, write the file(s) content out in the same format.\n\nInstruction:\n${instruction}`;

            try {
                const response = await callOpenAI(finalPrompt);
                const modelResponse = response.choices[0]?.message?.content?.trim() ?? '';
                if (modelResponse) {
                    await vscode.env.clipboard.writeText(modelResponse);
                    vscode.window.showInformationMessage(`Model response copied to clipboard:\n${modelResponse}`);
                } else {
                    vscode.window.showWarningMessage('Received an empty response from the model.');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to get response from OpenAI: ${error}`);
            }
        } else {
            vscode.window.showWarningMessage("Please enter an instruction before processing files.");
        }
    });

    let refreshFileListCommand = vscode.commands.registerCommand('codeless.refreshFileList', () => {
        treeDataProvider.refresh();
    });

    context.subscriptions.push(toggleFileCommand, updateInstructionCommand, processFilesCommand, refreshFileListCommand);
}

async function callOpenAI(prompt: string) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY, // Ensure you set your OpenAI API key in the environment variables
    });

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
    });

    return response;
}

export function deactivate() {}