import * as vscode from 'vscode';
import { stringLocal } from '../extension';
/**
 * WebView之后需要重写，所有的WebView类(编辑器展示)从此类继承
 */

/**
 * WebView代理接口
 */
export interface WebViewInterface{
    show(): WebViewClass; //页面交互展示
    disposeWebView(): void;
}

export abstract class WebViewClass{
    webView!: vscode.WebviewPanel;
    disposed: boolean = true;
    language = vscode.env.language;
    constructor(protected _extensionUri: vscode.Uri){
    }
    //文件视图读取
    // async getChildFolders(folder:string): Promise<string[]>{
    //     let folderNames: string[] = await vscode.commands.executeCommand("openFolder");
    //     return folderNames;
    // }
    
    disposeWebView(): void{
        this.webView.dispose();
        this.disposed = true;
    }

    createWebView(title: string): void{
       if(this.disposed){
        this.webView = vscode.window.createWebviewPanel(
            stringLocal[title],
            stringLocal[title],
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    this._extensionUri,
                ]
            }
        );
        this.disposed = false;
       }
    }
}

/**
 * WebView加载UI
 * @param path WebView-ui文件路径
 * @param title WebView标题,用来指明前端发送来的TypeView命令类型
 */
export function loadWebViewUI(path: string, title: string):any{

}