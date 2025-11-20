import * as vscode from 'vscode';

// 抽象基类，处理通用的文件读取和内容生成逻辑
abstract class BaseWebView {
	
	constructor() {
	}

	// 抽象方法，子类需要实现具体的HTML文件路径
	protected abstract getHtmlFileName(): string;
	protected abstract getCssFileName(): string;
	protected abstract getJsFileName(): string;
	

	// 通用的内容生成方法
	public getHtmlContent(): string {
		const fs = require('fs');
		const path = require('path');

		// 获取webview目录的绝对路径
		let webviewPath = path.join(__dirname, 'webview-ui');

		// 检查是否在dist目录中（打包后的情况）
		if (__dirname.endsWith('dist')) {
			// 在dist目录中，直接使用webview文件夹
			webviewPath = path.join(__dirname, 'webview-ui');
		} else {
			// 在开发时，使用src/webview文件夹
			webviewPath = path.join(__dirname, 'src', 'webview-ui');
		}

		const htmlFilePath = path.join(webviewPath, 'html', this.getHtmlFileName());

		try {
			// 检查文件是否存在
			if (!fs.existsSync(htmlFilePath)) {
				throw new Error(`HTML文件不存在: ${htmlFilePath}`);
			}

			// 读取HTML文件
			let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

			// 读取CSS文件
			const cssFilePath = path.join(webviewPath, 'css', this.getCssFileName());
			if (!fs.existsSync(cssFilePath)) {
				throw new Error(`CSS文件不存在: ${cssFilePath}`);
			}
			const cssContent = fs.readFileSync(cssFilePath, 'utf8');

			// 读取JS文件
			const jsFilePath = path.join(webviewPath, 'js', this.getJsFileName());
			if (!fs.existsSync(jsFilePath)) {
				throw new Error(`JS文件不存在: ${jsFilePath}`);
			}
			const jsContent = fs.readFileSync(jsFilePath, 'utf8');

			// 替换HTML中的外部引用为内联内容
			htmlContent = htmlContent.replace(
				`<link rel="stylesheet" href="css/${this.getCssFileName()}">`,
				`<style>${cssContent}</style>`
			);

			htmlContent = htmlContent.replace(
				`<script src="js/${this.getJsFileName()}"></script>`,
				`<script>${jsContent}</script>`
			);

			return htmlContent;

		} catch (error) {
			console.error(`读取HTML文件时出错:`, error);
			return '<p>页面加载失败</p>';
		}
	}
}

// 显示欢迎页面的类
export class showWelcome extends BaseWebView {
	protected getHtmlFileName(): string {
		return 'welcome.html';
	}

	protected getCssFileName(): string {
		return 'welcome.css';
	}

	protected getJsFileName(): string {
		return 'welcome.js';
	}

	private getPanelTitle(): string {
		return '欢迎使用 Welcome Extension';
	}
	private handleWebViewMessage(panel: vscode.WebviewPanel, message: any): void {
		switch (message.type) {
			case 'webviewReady':
				console.log('WebView 已就绪:', message.text);
				break;

			case 'networkStatus':
				console.log('网络状态:', message.status);
				// 可以在这里处理网络状态信息
				break;

			case 'hello':
				vscode.window.showInformationMessage(message.text);
				break;

			case 'close':
				panel.dispose();
				break;

			default:
				console.log('收到未知消息:', message);
		}
	}

	// WebView创建方法
	public createWebViewPanel(context: vscode.ExtensionContext, viewColumn: vscode.ViewColumn = vscode.ViewColumn.One): vscode.WebviewPanel {
		const panel = vscode.window.createWebviewPanel(
			this.getHtmlFileName().replace('.html', 'Page'), // 视图类型
			this.getPanelTitle(), // 面板标题
			viewColumn, // 显示在编辑器区域
			{
				// 启用JavaScript
				enableScripts: true,
				// 限制WebView可以访问的资源
				localResourceRoots: []
			}
		);

		// 设置WebView的HTML内容
		panel.webview.html = this.getHtmlContent();
		
		return panel;
	}
	public showWelcomePage(context: vscode.ExtensionContext): void {
		const panel = this.createWebViewPanel(context);
		
		// 处理来自WebView的消息
		panel.webview.onDidReceiveMessage(
			message => this.handleWebViewMessage(panel, message),
			undefined,
			context.subscriptions
		);

		// 当面板被关闭时，处理清理工作
		panel.onDidDispose(
			() => {
				// 当WebView面板被关闭时执行清理
			},
			null,
			context.subscriptions
		);
	}
}

// 显示按钮页面的类
export class Button extends BaseWebView {
	protected getHtmlFileName(): string {
		return 'button.html';
	}

	protected getCssFileName(): string {
		return 'button.css';
	}

	protected getJsFileName(): string {
		return 'button.js';
	}
	
}

// AI助手页面类
export class AIAssistantProvider extends BaseWebView {
    protected getHtmlFileName(): string {
        return 'ai_assistant.html';
    }

    protected getCssFileName(): string {
        return 'ai_assistant.css';
    }

    protected getJsFileName(): string {
        return 'ai_assistant.js';
    }
}
