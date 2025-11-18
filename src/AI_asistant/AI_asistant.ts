import * as vscode from 'vscode';
import { TongyiAPI, TongyiMessage, AVAILABLE_MODELS, DEFAULT_MODEL, TongyiModel } from '../api/api';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    model?: TongyiModel; // 添加模型信息
}

export class AIAssistant {
    private static instance: AIAssistant;
    private tongyiAPI: TongyiAPI;
    private chatHistory: ChatMessage[] = [];
    private webviewPanel: vscode.WebviewPanel | undefined;
    private currentModel: TongyiModel = DEFAULT_MODEL;

    private constructor() {
        this.tongyiAPI = new TongyiAPI();
        this.loadModelConfig();
    }

    public static getInstance(): AIAssistant {
        if (!AIAssistant.instance) {
            AIAssistant.instance = new AIAssistant();
        }
        return AIAssistant.instance;
    }

    private async loadModelConfig(): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiAssistant');
        const savedModel = config.get<string>('selectedModel');
        this.currentModel = this.isValidModel(savedModel) ? savedModel as TongyiModel : DEFAULT_MODEL;
    }

    private isValidModel(model: string | undefined): model is TongyiModel {
        return model ? model in AVAILABLE_MODELS : false;
    }

    public async initialize(): Promise<void> {
        // 检查API密钥配置
        await this.checkApiKey();
    }

    private async checkApiKey(): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiAssistant');
        const apiKey = config.get<string>('tongyiApiKey');
        
        if (!apiKey) {
            const result = await vscode.window.showInformationMessage(
                '请配置通义千问API密钥以使用AI助手功能',
                '立即配置',
                '稍后配置'
            );
            
            if (result === '立即配置') {
                await this.configureApiKey();
            }
        }
    }

    public async configureApiKey(): Promise<void> {
        const apiKey = await vscode.window.showInputBox({
            prompt: '请输入通义千问API密钥',
            placeHolder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value) {
                    return 'API密钥不能为空';
                }
                if (!value.startsWith('sk-')) {
                    return 'API密钥格式不正确，应以sk-开头';
                }
                return null;
            }
        });

        if (apiKey) {
            try {
                await this.tongyiAPI.setApiKey(apiKey);
                vscode.window.showInformationMessage('API密钥配置成功！');
            } catch (error) {
                vscode.window.showErrorMessage(`API密钥配置失败: ${error}`);
            }
        }
    }

    public async sendMessage(content: string, model?: TongyiModel): Promise<string> {
        const selectedModel = model || this.currentModel;
        
        // 添加用户消息到历史记录
        const userMessage: ChatMessage = {
            id: this.generateId(),
            role: 'user',
            content: content,
            timestamp: new Date(),
            model: selectedModel
        };
        this.chatHistory.push(userMessage);

        // 准备发送给API的消息
        const messages: TongyiMessage[] = this.prepareMessagesForAPI();

        try {
            const response = await this.tongyiAPI.sendMessage(messages, selectedModel);
            
            // 添加助手回复到历史记录
            const assistantMessage: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: response.output.text,
                timestamp: new Date(),
                model: selectedModel
            };
            this.chatHistory.push(assistantMessage);

            // 通知WebView更新
            this.notifyWebviewUpdate();

            return response.output.text;
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`,
                timestamp: new Date(),
                model: selectedModel
            };
            this.chatHistory.push(errorMessage);
            
            this.notifyWebviewUpdate();
            throw error;
        }
    }

    private prepareMessagesForAPI(): TongyiMessage[] {
        // 限制历史消息数量以避免token超限
        const recentHistory = this.chatHistory.slice(-10); // 保留最近10条消息
        
        return recentHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }

    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    public getChatHistory(): ChatMessage[] {
        return [...this.chatHistory];
    }

    public clearChatHistory(): void {
        this.chatHistory = [];
        this.notifyWebviewUpdate();
    }

    public setWebviewPanel(panel: vscode.WebviewPanel): void {
        this.webviewPanel = panel;
    }

    private notifyWebviewUpdate(): void {
        if (this.webviewPanel) {
            this.webviewPanel.webview.postMessage({
                type: 'chatUpdate',
                history: this.chatHistory,
                currentModel: this.currentModel
            });
        }
    }

    public async quickQuestion(question: string, model?: TongyiModel): Promise<string> {
        const selectedModel = model || this.currentModel;
        return await this.tongyiAPI.quickChat(question, selectedModel);
    }

    // 模型管理相关方法
    public getAvailableModels(): Record<TongyiModel, string> {
        return AVAILABLE_MODELS;
    }

    public getCurrentModel(): TongyiModel {
        return this.currentModel;
    }

    public async setCurrentModel(model: TongyiModel): Promise<void> {
        if (!(model in AVAILABLE_MODELS)) {
            throw new Error(`不支持的模型: ${model}`);
        }
        
        this.currentModel = model;
        
        // 保存到配置
        const config = vscode.workspace.getConfiguration('aiAssistant');
        await config.update('selectedModel', model, vscode.ConfigurationTarget.Global);
        
        // 通知WebView更新
        this.notifyWebviewUpdate();
        
        vscode.window.showInformationMessage(`已切换到模型: ${AVAILABLE_MODELS[model]}`);
    }

    // 获取模型显示名称
    public getModelDisplayName(model: TongyiModel): string {
        return AVAILABLE_MODELS[model] || model;
    }
}

// 导出单例实例
export const aiAssistant = AIAssistant.getInstance();