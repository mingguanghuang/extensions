import * as vscode from "vscode";
import { WebViewClass, WebViewInterface ,getHtmlForWebview} from "./webview";

export class ProjectTypeWebviewProvider extends WebViewClass implements WebViewInterface {
    constructor(protected readonly _extensionUri: vscode.Uri) { 
        super(_extensionUri);
    }
    public show(): WebViewClass {
        this.createWebView("ProjectCreateType");
        // 设置webview的HTML内容 - 使用CreateProject页面
        const htmlContent = getHtmlForWebview(this.webView.webview, this._extensionUri, '/dist/webview-ui/ProjectType');
        this.webView.webview.html = htmlContent;
        
        // 显示webview
        this.webView.reveal(vscode.ViewColumn.One);

        return this;
    }
    
}

export class ShowWelcomeWebviewProvider extends WebViewClass implements WebViewInterface {
    constructor(protected readonly _extensionUri: vscode.Uri) { 
        super(_extensionUri);
    }
    public show(): WebViewClass {
        this.createWebView("ShowWelcome");
        
        // 设置webview的HTML内容 - 使用ShowWelcome页面
        const htmlContent = getHtmlForWebview(this.webView.webview, this._extensionUri, '/dist/webview-ui/Welcome');
        this.webView.webview.html = htmlContent;
        
        // 显示webview
        this.webView.reveal(vscode.ViewColumn.One);

        return this;
    }
    
}