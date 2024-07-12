import * as vscode from 'vscode';
import * as path from 'path';
import { FileItem } from './fileItem';

export class CodelessTreeDataProvider implements vscode.TreeDataProvider<FileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void> = new vscode.EventEmitter<FileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private fileItems: FileItem[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FileItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FileItem): Thenable<FileItem[]> {
        if (!vscode.workspace.workspaceFolders) {
            return Promise.resolve([]);
        }
        if (element) {
            return Promise.resolve([]);
        } else {
            return this.getWorkspaceFiles();
        }
    }

    private async getWorkspaceFiles(): Promise<FileItem[]> {
        if (this.fileItems.length === 0) {
            const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
            this.fileItems = files.map(file => new FileItem(
                path.basename(file.fsPath),
                vscode.TreeItemCollapsibleState.None,
                file
            ));
        }
        return this.fileItems;
    }

    toggleSelection(item: FileItem) {
        const existingItem = this.fileItems.find(fi => fi.resourceUri.fsPath === item.resourceUri.fsPath);
        if (existingItem) {
            existingItem.toggleSelection();
            this.refresh();
        }
    }

    getSelectedFiles(): FileItem[] {
        return this.fileItems.filter(item => item.selected);
    }
}