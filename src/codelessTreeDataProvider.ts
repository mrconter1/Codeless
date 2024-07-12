import * as vscode from 'vscode';
import * as path from 'path';
import { FileItem, RootItem } from './fileItem';

export class CodelessTreeDataProvider implements vscode.TreeDataProvider<FileItem | RootItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | RootItem | undefined | null | void> = new vscode.EventEmitter<FileItem | RootItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FileItem | RootItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private rootItem: RootItem = new RootItem();
    private fileItems: FileItem[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FileItem | RootItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FileItem | RootItem): Thenable<(FileItem | RootItem)[]> {
        if (!vscode.workspace.workspaceFolders) {
            return Promise.resolve([]);
        }
        if (!element) {
            return Promise.resolve([this.rootItem]);
        } else if (element === this.rootItem) {
            return this.getWorkspaceFiles();
        } else {
            return Promise.resolve([]);
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