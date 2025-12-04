import * as vscode from 'vscode';
import { stringLocal } from '../extension';
import * as path from 'path';
import * as fs from 'fs';
import { ProjectPath } from '../ProjectPath';
/**
 * WebView代理接口
 */
export interface WebViewInterface{
    /**
     * WebView视图展示（面板，标题，交互逻辑）
     */
    show(): WebViewClass; 
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

   public createWebView(title: string): void {
       // 检查webview是否有效且未释放
       if (this.webView && !this.disposed) {
           this.webView.reveal(vscode.ViewColumn.One);
           return;
       }
       
       // 创建新的webview
       this.webView = vscode.window.createWebviewPanel(
           stringLocal[title] || title,
           stringLocal[title] || title,
           vscode.ViewColumn.One,
           {
               enableScripts: true,
               localResourceRoots: [this._extensionUri]
           }
       );
       
       // 重置disposed状态
       this.disposed = false;
       
       // 监听关闭事件，正确更新disposed状态
       this.webView.onDidDispose(() => {
           this.disposed = true;
       });
   }
}

/** 
* 构建webview UI的HTML内容
* @param webview - 用于转换资源路径的Webview实例
* @returns 包含替换后的HTML内容的字符串
**/
export function getHtmlForWebview(webview: vscode.Webview, webviewName: string) {
        let webviewPath: string;
        switch(webviewName){
            case 'AIAssistant':
                webviewPath = ProjectPath.getAIAssistantPath();
                break;
            case 'CreateProject':
                webviewPath = ProjectPath.getCreateProjectPath();
                break;
            case 'ProjectType':
                webviewPath = ProjectPath.getProjectTypePath();
                break;
            case 'Welcome':
                webviewPath = ProjectPath.getWelcomePath();
                break;
            default:
                throw new Error(`Unknown webViewName: ${webviewName}`);
        }

        // 前端页面的入口文件
        const indexPath = path.join(webviewPath, 'index.html');
        let indexHtml = fs.readFileSync(indexPath, 'utf-8');
        const matchLinks = /(href|src)="([^"]*)"/g;
        const toUri = (_: string, prefix: 'href' | 'src', link: string) => {
            if (link === '#') {
                return `${prefix}="${link}"`;
            }
            const _path = path.join(webviewPath, link);
            const uri = vscode.Uri.file(_path);
            return `${prefix}="${webview.asWebviewUri(uri)}"`;
        };
        // 将本地资源路径替换成 webview 可以加载的资源路径
        indexHtml = indexHtml.replace(matchLinks, toUri);
        return indexHtml;
    }