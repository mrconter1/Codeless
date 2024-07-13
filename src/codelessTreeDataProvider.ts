import * as vscode from 'vscode';
import * as path from 'path';

export class CodelessTreeDataProvider implements vscode.TreeDataProvider<never> {
    private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;

    private fileItems: Array<{ path: string, name: string, selected: boolean }> = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(): never {
        throw new Error('Method not implemented.');
    }

    getChildren(): never[] {
        return [];
    }

    async getFiles(): Promise<Array<{ path: string, name: string, selected: boolean }>> {
        if (this.fileItems.length === 0) {
            const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
            this.fileItems = files.map(file => ({
                path: file.fsPath,
                name: path.basename(file.fsPath),
                selected: false
            }));
        }
        return this.fileItems;
    }

    toggleSelection(path: string) {
        const item = this.fileItems.find(fi => fi.path === path);
        if (item) {
            item.selected = !item.selected;
            this.refresh();
        }
    }

    getSelectedFiles(): Array<{ path: string, name: string }> {
        return this.fileItems.filter(item => item.selected);
    }
}