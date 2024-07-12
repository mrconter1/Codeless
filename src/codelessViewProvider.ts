// codelessViewProvider.ts
import * as vscode from 'vscode';
import { CodelessTreeDataProvider } from './codelessTreeDataProvider';

export class CodelessViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'codelessExplorer';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _treeDataProvider: CodelessTreeDataProvider
    ) { }

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'instruction':
                    vscode.commands.executeCommand('codeless.updateInstruction', data.value);
                    break;
                case 'toggleFile':
                    vscode.commands.executeCommand('codeless.toggleFile', data.path);
                    break;
            }
        });

        this._treeDataProvider.onDidChangeTreeData(() => {
            this.updateFileList();
        });

        // Initialize the file list
        await this.updateFileList();
    }

    private async updateFileList() {
        if (this._view) {
            const files = await this._treeDataProvider.getFiles();
            this._view.webview.postMessage({
                type: 'updateFiles',
                files: files
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Codeless Explorer</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 10px;
                    }
                    h3 {
                        margin-bottom: 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 5px;
                    }
                    #instruction {
                        width: 100%;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        padding: 5px;
                        resize: vertical;
                    }
                    #fileList {
                        margin-top: 15px;
                    }
                    .file {
                        display: flex;
                        align-items: center;
                        margin-bottom: 8px;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 3px;
                        transition: background-color 0.2s;
                    }
                    .file:hover {
                        background-color: var(--vscode-list-hoverBackground);
                    }
                    .file.selected {
                        background-color: var(--vscode-list-activeSelectionBackground);
                        color: var(--vscode-list-activeSelectionForeground);
                    }
                    .file input {
                        margin-right: 8px;
                        cursor: pointer;
                    }
                    .file label {
                        flex-grow: 1;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <h3>Instruction</h3>
                <textarea id="instruction" rows="4" placeholder="Enter instructions here..."></textarea>
                <h3>Files</h3>
                <div id="fileList"></div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const instructionTextarea = document.getElementById('instruction');
                    const fileList = document.getElementById('fileList');

                    instructionTextarea.addEventListener('input', () => {
                        vscode.postMessage({
                            type: 'instruction',
                            value: instructionTextarea.value
                        });
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'updateFiles':
                                updateFileList(message.files);
                                break;
                        }
                    });

                    function updateFileList(files) {
                        fileList.innerHTML = '';
                        files.forEach(file => {
                            const fileDiv = document.createElement('div');
                            fileDiv.className = 'file' + (file.selected ? ' selected' : '');
                            
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.id = file.path;
                            checkbox.checked = file.selected;
                            
                            const label = document.createElement('label');
                            label.textContent = file.name;
                            label.htmlFor = file.path;
                            
                            fileDiv.appendChild(checkbox);
                            fileDiv.appendChild(label);
                            
                            fileDiv.addEventListener('click', (event) => {
                                // Prevent default checkbox behavior
                                event.preventDefault();
                                
                                // Toggle checkbox
                                checkbox.checked = !checkbox.checked;
                                
                                // Toggle selected class
                                fileDiv.classList.toggle('selected');
                                
                                // Send message to extension
                                vscode.postMessage({
                                    type: 'toggleFile',
                                    path: file.path
                                });
                            });
                            
                            fileList.appendChild(fileDiv);
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }
}