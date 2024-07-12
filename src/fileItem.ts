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

export class RootItem extends vscode.TreeItem {
    constructor(label: string) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        this.contextValue = 'root';
    }
}

export class InstructionItem extends vscode.TreeItem {
    constructor(private instruction: string) {
        super("Instruction", vscode.TreeItemCollapsibleState.None);
        this.description = instruction || "Click to add instruction";
        this.contextValue = 'instruction';
        this.command = {
            title: "Edit Instruction",
            command: "codeless.editInstruction",
            arguments: [this]
        };
    }

    updateInstruction(newInstruction: string) {
        this.instruction = newInstruction;
        this.description = newInstruction || "Click to add instruction";
    }

    getInstruction(): string {
        return this.instruction;
    }
}
