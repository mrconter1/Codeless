import * as vscode from 'vscode';
import * as path from 'path';

export class FileItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly resourceUri: vscode.Uri
    ) {
        super(label, collapsibleState);
        this.tooltip = this.resourceUri.fsPath;
        this.description = path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath, this.resourceUri.fsPath);
    }
}