import * as vscode from "vscode";
import { getHtmlForWebview } from './webview';

export class ButtonWebviewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) { 
    this._extensionUri = _extensionUri;
  }

  public static readonly viewType = "create.project";


  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {

    // 设置webview选项
    webviewView.webview.options = {
      enableScripts: true,
      // 允许加载扩展资源
      localResourceRoots: [
        this._extensionUri,
      ]
    };
    
    
    // 构建webview UI的HTML内容
    const htmlContent = getHtmlForWebview(webviewView.webview, this._extensionUri, '/dist/webview-ui/CreateProject');
    webviewView.webview.html = htmlContent;

    // 监听工作区文件夹变化，更新上下文
    const updateContext = () => {
      const hasWorkspaceFolders = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0;
      vscode.commands.executeCommand('setContext', 'hasWorkspaceFolders', hasWorkspaceFolders);
    };

    // 初始更新
    updateContext();

    // 监听工作区文件夹变化
    const workspaceChangeDisposable = vscode.workspace.onDidChangeWorkspaceFolders(updateContext);
    // 监听webview消息
    const messageDisposable = webviewView.webview.onDidReceiveMessage((message) => {
      this.handleWebViewMessage(webviewView, message);
    });

    // 当webview被销毁时清理监听器
    webviewView.onDidDispose(() => {
      workspaceChangeDisposable.dispose();
      messageDisposable.dispose();
    });
  }

  private async handleOpenFolder() {
    try {
      const openFolderOption = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: '选择文件夹',
        title: '选择项目文件夹'
      });
      if (openFolderOption && openFolderOption.length > 0) {
        const folderUri = openFolderOption[0];
        await vscode.commands.executeCommand('vscode.openFolder', folderUri);
      }
    } catch (error) {
      console.error('打开文件夹失败:', error);
      vscode.window.showErrorMessage('打开文件夹失败');
    }
  }

  
  private handleWebViewMessage(command: vscode.WebviewView, message: any): void {
      switch (message.type) {
        case 'openFolder':
          this.handleOpenFolder();
          console.log('打开文件夹消息:', message);
          break;
  
        case 'createProject':
          vscode.commands.executeCommand( "project.type.view");
          console.log('创建项目消息:', message);
          break;

        default:
          console.log('收到未知消息:', message);
      }
    }
}