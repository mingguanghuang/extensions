import * as vscode from "vscode";
import { Button } from './getHTMLContent';

export class ButtonWebviewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) { 
    this._extensionUri = _extensionUri;
  }

  public static readonly viewType = "create.project";


  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
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
    webviewView.webview.html = new Button().getHtmlContent();

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

  private async handleCreateProject() {
    try {
      const createProjectOpetion = await vscode.window.showOpenDialog(
        {
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: '选择项目位置',
          title: '选择项目创建的文件夹位置'
        }
      );
      if (!createProjectOpetion || createProjectOpetion.length === 0) {
        return;
      }
      const projectFolder = createProjectOpetion[0];
      const projectName = await vscode.window.showInputBox({
        prompt: '请输入项目名称',
        placeHolder: '例如：my-project',
        validateInput: (value: string) => {
          if (!value) {
            return '项目名称不能为空';
          }
          else if (/[^\w-]/.test(value)) {
            return '项目名称只能包含字母、数字、短横线和下划线';
          }
          else if (value.includes(' ')) {
            return '项目名称不能包含空格';
          }
          return null;
        }
      });
      if (!projectName) {
        return;
      }
      const projectPath = vscode.Uri.joinPath(projectFolder, projectName);

      try {
        await vscode.workspace.fs.createDirectory(projectPath);
        const packageJsonContent = JSON.stringify({
          name: projectName,
          version: '1.0.0',
          description: `A new project: ${projectName}`,
          main: 'index.js',
          scripts: {
            start: 'node index.js'
          },
          dependencies: {}
        }, null, 2);
        const packageJsonUri = vscode.Uri.joinPath(projectPath, 'package.json');
        await vscode.workspace.fs.writeFile(packageJsonUri, Buffer.from(packageJsonContent, 'utf-8'));

        // 创建index.js文件
        const indexJsContent = 'console.log("Hello, World!");';
        const indexJsUri = vscode.Uri.joinPath(projectPath, 'index.js');
        await vscode.workspace.fs.writeFile(indexJsUri, Buffer.from(indexJsContent, 'utf-8'));

        //打开创建的项目文件夹
        await vscode.commands.executeCommand('vscode.openFolder', projectPath);
        vscode.window.showErrorMessage(`项目 ${projectName} 已创建在 ${projectPath.fsPath}`);
      } catch (error) {
        console.error('创建项目失败:', error);
        vscode.window.showErrorMessage(`创建项目失败: ${error}`);
      }

    } catch (error) {
      console.error('创建项目失败:', error);
      vscode.window.showErrorMessage(`创建项目过程中出错：${error}`);
    }
  }
  private handleWebViewMessage(command: vscode.WebviewView, message: any): void {
      switch (message.type) {
        case 'openFolder':
          this.handleOpenFolder();
          console.log('打开文件夹消息:', message);
          break;
  
        case 'createProject':
          this.handleCreateProject();
          console.log('创建项目消息:', message);
          break;

        default:
          console.log('收到未知消息:', message);
      }
    }
}
