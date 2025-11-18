// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { FileTreeViewProvider, TreeItem} from './webview/FileTreeView';
import { showWelcome, Button } from './webview/getHTMLContent';
import {ButtonWebviewProvider} from './webview/ButtonWebview';
import {AIAsistantWebViewProvider} from './webview/AI_AssistantWebView';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
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
	const aiAssistantWebview = vscode.window.registerWebviewViewProvider('treeView-item_AI', new AIAsistantWebViewProvider(context.extensionUri));
		
	// 在VS Code启动完成后自动显示欢迎页面（只在第一次激活时显示）
	let ShowWelcome = new showWelcome();
	const hasShownWelcome = context.globalState.get<boolean>('hasShownWelcome', false);
	if (!hasShownWelcome) {
		// 第一次激活，显示欢迎页面
		ShowWelcome.showWelcomePage(context);
		// 标记为已显示
		context.globalState.update('hasShownWelcome', true);
		console.log('首次激活插件，显示欢迎页面');
	} else {
		console.log('插件已激活过，不再显示欢迎页面');
	}
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('welcome-extension-plugin.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from myextension!');
	});

	// 注册显示欢迎页面的命令
	const showWelcomeCommand = vscode.commands.registerCommand('welcome-extension-plugin.showWelcome', () => {
		ShowWelcome.showWelcomePage(context);
	});


	context.subscriptions.push(disposable, showWelcomeCommand,buttonWebview,fileTreeView);
}




// This method is called when your extension is deactivated
export function deactivate() {
	// Use the console to output diagnostic information when extension is deactivated
	console.log('Extension "welcome-extension-plugin" is now deactivated. Cleaning up resources...');
	
	// Note: VS Code automatically handles the disposal of resources
	// that were added to context.subscriptions during activation
	// No additional cleanup is needed for this simple extension
}