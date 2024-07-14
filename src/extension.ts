import * as vscode from 'vscode';
import OpenAI from 'openai';

export function activate(context: vscode.ExtensionContext) {
    console.log('Codeless extension is now active!');

    let processCommand = vscode.commands.registerCommand('codeless.process', async () => {
        const instruction = await vscode.window.showInputBox({
            prompt: "Enter your instruction",
            placeHolder: "e.g., Refactor the code to use async/await"
        });

        if (!instruction) {
            vscode.window.showWarningMessage("No instruction provided.");
            return;
        }

        const openEditors = vscode.window.visibleTextEditors;
        if (openEditors.length === 0) {
            vscode.window.showWarningMessage("No open files to process.");
            return;
        }

        const files = openEditors.map(editor => ({
            path: editor.document.uri.fsPath,
            name: vscode.workspace.asRelativePath(editor.document.uri),
            content: editor.document.getText()
        }));

        const content = files.map(file => `\`\`\`${file.name}\n${file.content}\n\`\`\``).join('\n\n');
        const finalPrompt = `${content}\n\nPlease take the above files into consideration and try to follow the instruction. **Only** write out the files that need to be modified and make sure to **always** write out the complete file (if it has modifications). Also, write the file(s) content out in the same format.\n\nInstruction:\n${instruction}`;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Processing files...",
            cancellable: false
        }, async (progress) => {
            try {
                const response = await callOpenAI(finalPrompt);
                const modelResponse = response.choices[0]?.message?.content?.trim() ?? '';
                if (modelResponse) {
                    console.log('Model Response:', modelResponse);
                    await updateFilesWithResponse(modelResponse, files);
                    vscode.window.showInformationMessage('Files updated with the model response.');
                } else {
                    vscode.window.showWarningMessage('Received an empty response from the model.');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to get response from OpenAI: ${error}`);
            }
        });
    });

    context.subscriptions.push(processCommand);
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

async function updateFilesWithResponse(modelResponse: string, files: Array<{ path: string, name: string, content: string }>) {
    const fileContents = parseModelResponse(modelResponse);
    console.log('Parsed File Contents:', fileContents);

    for (const file of files) {
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
        console.log(`Parsed file: ${fileName}, content length: ${content.length}`);
        fileContents[fileName] = content;
    }

    return fileContents;
}

export function deactivate() {}