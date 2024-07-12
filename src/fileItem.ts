import * as vscode from 'vscode';
import * as path from 'path';

export class FileItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly resourceUri: vscode.Uri,
        public selected: boolean = false
    ) {
        super(label, collapsibleState);
        this.tooltip = this.resourceUri.fsPath;
        this.description = path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath, this.resourceUri.fsPath);
        this.updateIconPath();
        this.command = {
            title: "Select File",
            command: "codeless.selectFile",
            arguments: [this]
        };
    }

    updateIconPath() {
        this.iconPath = this.selected 
            ? new vscode.ThemeIcon('check')
            : new vscode.ThemeIcon('file');
    }

    toggleSelection() {
        this.selected = !this.selected;
        this.updateIconPath();
    }
}