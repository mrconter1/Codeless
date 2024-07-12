import * as vscode from 'vscode';
import * as path from 'path';
import { FileItem } from './fileItem';

export class CodelessTreeDataProvider implements vscode.TreeDataProvider<FileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void> = new vscode.EventEmitter<FileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

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
            return Promise.resolve([]); // For now, we're not handling subdirectories
        } else {
            return this.getWorkspaceFiles();
        }
    }

    private async getWorkspaceFiles(): Promise<FileItem[]> {
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
        return files.map(file => new FileItem(
            path.basename(file.fsPath),
            vscode.TreeItemCollapsibleState.None,
            file
        ));
    }
}