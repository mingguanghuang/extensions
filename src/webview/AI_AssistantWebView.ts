import * as vscode from 'vscode';
import { AIAssistantProvider } from './getHTMLContent';
import { aiAssistant } from '../AI_asistant/AI_asistant';
import { TongyiModel } from '../api/api';
export class AIAsistantWebViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ai.assistant';

    constructor(private readonly _extensionUri: vscode.Uri) {
        this._extensionUri = _extensionUri;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        // 设置webview选项
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // 创建AI助手HTML内容
        const aiAssistantProvider = new AIAssistantProvider();
        webviewView.webview.html = aiAssistantProvider.getHtmlContent();

        // 设置webview面板
        const panel = vscode.window.createWebviewPanel(
            'aiAssistant',
            'AI助手',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [this._extensionUri]
            }
        );

        aiAssistant.setWebviewPanel(panel);

        // 处理来自webview的消息
        webviewView.webview.onDidReceiveMessage(async (message) => {
            await this.handleWebViewMessage(webviewView, message);
        });

        // 初始发送聊天历史和模型信息
        this.sendInitialData(webviewView.webview);
    }

    private async handleWebViewMessage(webviewView: vscode.WebviewView, message: any): Promise<void> {
        switch (message.type) {
            case 'sendMessage':
                await this.handleSendMessage(webviewView, message.content, message.model);
                break;

            case 'clearHistory':
                aiAssistant.clearChatHistory();
                this.sendChatHistory(webviewView.webview);
                break;

            case 'configureApiKey':
                await aiAssistant.configureApiKey();
                break;

            case 'getHistory':
                this.sendChatHistory(webviewView.webview);
                break;

            case 'getModels':
                this.sendAvailableModels(webviewView.webview);
                break;

            case 'setModel':
                await this.handleSetModel(webviewView, message.model);
                break;

            case 'getCurrentModel':
                this.sendCurrentModel(webviewView.webview);
                break;

            default:
                console.log('收到未知消息:', message);
        }
    }

    private async handleSendMessage(webviewView: vscode.WebviewView, content: string, model?: string): Promise<void> {
        if (!content.trim()) {
            return;
        }

        try {
            // 显示加载状态
            webviewView.webview.postMessage({
                type: 'loading',
                messageId: 'current'
            });

            // 发送消息给AI助手
            await aiAssistant.sendMessage(content, model as TongyiModel);

            // 发送更新后的历史记录
            this.sendChatHistory(webviewView.webview);
        } catch (error) {
            console.error('发送消息失败:', error);
            webviewView.webview.postMessage({
                type: 'error',
                message: `发送消息失败: ${error}`
            });
        }
    }

    private async handleSetModel(webviewView: vscode.WebviewView, model: string): Promise<void> {
        try {
            await aiAssistant.setCurrentModel(model as TongyiModel);
            this.sendCurrentModel(webviewView.webview);
        } catch (error) {
            console.error('切换模型失败:', error);
            webviewView.webview.postMessage({
                type: 'error',
                message: `切换模型失败: ${error}`
            });
        }
    }

    private sendInitialData(webview: vscode.Webview): void {
        this.sendChatHistory(webview);
        this.sendAvailableModels(webview);
        this.sendCurrentModel(webview);
    }

    private sendChatHistory(webview: vscode.Webview): void {
        const history = aiAssistant.getChatHistory();
        webview.postMessage({
            type: 'chatHistory',
            history: history
        });
    }

    private sendAvailableModels(webview: vscode.Webview): void {
        const models = aiAssistant.getAvailableModels();
        webview.postMessage({
            type: 'availableModels',
            models: models
        });
    }

    private sendCurrentModel(webview: vscode.Webview): void {
        const currentModel = aiAssistant.getCurrentModel();
        webview.postMessage({
            type: 'currentModel',
            model: currentModel,
            displayName: aiAssistant.getModelDisplayName(currentModel)
        });
    }
}