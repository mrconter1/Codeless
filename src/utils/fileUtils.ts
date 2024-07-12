import * as vscode from 'vscode';
import * as path from 'path';
import { FileItem } from '../fileItem';

export async function getWorkspaceFiles(): Promise<FileItem[]> {
    const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
    return files.map(file => new FileItem(
        path.basename(file.fsPath),
        vscode.TreeItemCollapsibleState.None,
        file
    ));
}