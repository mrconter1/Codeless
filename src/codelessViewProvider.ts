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

        webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);

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

    private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'webview.html');
        const buffer = await vscode.workspace.fs.readFile(htmlPath);
        return buffer.toString();
    }
}
