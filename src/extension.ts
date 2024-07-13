import * as vscode from 'vscode';
import OpenAI from 'openai';
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
                    console.log('Model Response:', modelResponse); // Logging the model response
                    await updateFilesWithResponse(modelResponse, selectedFiles);
                    vscode.window.showInformationMessage('Files updated with the model response.');
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
        apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
    });

    return response;
}

async function updateFilesWithResponse(modelResponse: string, selectedFiles: Array<{ path: string, name: string }>) {
    const fileContents = parseModelResponse(modelResponse);
    console.log('Parsed File Contents:', fileContents); // Logging parsed file contents

    for (const file of selectedFiles) {
        const newContent = fileContents[file.name];
        if (newContent) {
            const document = await vscode.workspace.openTextDocument(file.path);
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );
            edit.replace(document.uri, fullRange, newContent);
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                await document.save();
                console.log(`File ${file.name} updated successfully.`);
            } else {
                console.error(`Failed to apply edit to ${file.name}`);
            }
        } else {
            console.warn(`No new content found for ${file.name}`);
        }
    }
}

function parseModelResponse(modelResponse: string): { [key: string]: string } {
    const fileContents: { [key: string]: string } = {};
    const regex = /```([^`\n]+)\n([\s\S]*?)\n```/g;
    let match;

    while ((match = regex.exec(modelResponse)) !== null) {
        const fileName = match[1].trim();
        const content = match[2].trim();
        console.log(`Parsed file: ${fileName}, content length: ${content.length}`); // Debugging log
        fileContents[fileName] = content;
    }

    return fileContents;
}

export function deactivate() {}