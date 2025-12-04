import * as vscode from 'vscode';
import { FileTreeViewProvider, TreeItem} from './webview/FileTreeView';
import {ButtonWebviewProvider} from './webview/ButtonWebview';
import { AI_asistant_WebViewProvider } from './webview/AI_AssistantWebView';
import { getLang } from './StringLangLabel';
import { ProjectTypeWebviewProvider, ShowWelcomeWebviewProvider } from './webview/WebViewProvider';
import {ProjectPath} from './ProjectPath';


export let stringLocal : any;
export let projectPath: ProjectPath;
// export let isRefresh: boolean;


export function activate(context: vscode.ExtensionContext) {
	projectPath = ProjectPath.getInstance(context);
	stringLocal = getLang();
	
	console.log('Congratulations, your extension "welcome-extension-plugin" is now active!');

	//手动执行容器视图
	// vscode.commands.executeCommand("workbench.view.extension.treeView");

	// 注册文件树视图
	const fileTreeViewProvider = new FileTreeViewProvider();
	const fileTreeView = vscode.window.createTreeView('fileTreeView', {
		treeDataProvider: fileTreeViewProvider
	});
	
	const buttonWebview = vscode.window.registerWebviewViewProvider('project.create', new ButtonWebviewProvider(context.extensionUri));
	
	// 注册AI助手视图
	const aiAssistantWebview = vscode.window.registerWebviewViewProvider(
		AI_asistant_WebViewProvider.viewType, 
		new AI_asistant_WebViewProvider(context.extensionUri)
	);
	// 注册项目类型选择视图
	const projectTypeWebview = vscode.commands.registerCommand(
		"project.type.view", 
		() => new ProjectTypeWebviewProvider(context.extensionUri).show()
	);
		
	// 在VS Code启动完成后自动显示欢迎页面（只在第一次激活时显示）
	const hasShownWelcome = context.globalState.get<boolean>('hasShownWelcome', false);
	if (!hasShownWelcome) {
	    // 第一次激活，延迟显示欢迎页面（等待VS Code完全启动）
	    setTimeout(() => {
	        new ShowWelcomeWebviewProvider(context.extensionUri).show();
	        // 标记为已显示
	        context.globalState.update('hasShownWelcome', true);
	        console.log('首次激活插件，显示欢迎页面');
	    }, 1000);
	} else {
	    console.log('插件已激活过，不再显示欢迎页面');
	}
	
	const disposable = vscode.commands.registerCommand('welcome-extension-plugin.helloWorld', () => {
		
		vscode.window.showInformationMessage('Hello World from myextension!');
	});

	// 注册显示欢迎页面的命令
	const showWelcomeCommand = vscode.commands.registerCommand('welcome-extension-plugin.showWelcome', () => {
		new ShowWelcomeWebviewProvider(context.extensionUri).show();
	});


	context.subscriptions.push(disposable, showWelcomeCommand, buttonWebview, fileTreeView, aiAssistantWebview, projectTypeWebview);
}





export function deactivate() {
	
	console.log('Extension "welcome-extension-plugin" is now deactivated. Cleaning up resources...');
	
	
}