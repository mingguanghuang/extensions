import * as vscode from 'vscode';


export interface WebViewInterface{
    show(): void;
    dispose(): void;
}

export abstract class WebViewClass {
    webView!: vscode.WebviewPanel;
    disposed: boolean = true;
    language = vscode.languages;

    async getChildFolders(folder:string): Promise<string[]>{
        let folderNames: string[] = await vscode.commands.executeCommand("openFolder");
        return folderNames;
    }
} 