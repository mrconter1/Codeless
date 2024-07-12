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
                    body { padding: 5px; }
                    #fileList { margin-top: 10px; }
                    .file { display: flex; align-items: center; margin-bottom: 5px; }
                    .file input { margin-right: 5px; }
                </style>
            </head>
            <body>
                <h3>Instruction</h3>
                <textarea id="instruction" rows="4" cols="30"></textarea>
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
                            fileDiv.className = 'file';
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.checked = file.selected;
                            checkbox.addEventListener('change', () => {
                                vscode.postMessage({
                                    type: 'toggleFile',
                                    path: file.path
                                });
                            });
                            const label = document.createElement('label');
                            label.textContent = file.name;
                            fileDiv.appendChild(checkbox);
                            fileDiv.appendChild(label);
                            fileList.appendChild(fileDiv);
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }
}