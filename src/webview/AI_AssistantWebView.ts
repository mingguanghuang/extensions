import * as vscode from 'vscode';
import { getHtmlForWebview } from './webview';
import { TongyiModel, ALI_TONGYI_Prompt_Messages, ALI_TONGYI_API_KEY, ALI_TONGYI_API_URL } from '../AI_asistant/model_config';
import { TONGYI_AIAssistant } from '../AI_asistant/AI_asistant';
import { MarkdownBuilder, MarkdownTemplateRenderer } from '../FormatMarkDown';
export class AI_asistant_WebViewProvider implements vscode.WebviewViewProvider {
    private _webviewView?: vscode.WebviewView;
    private _aiAssistantProcess?: TongYi_AI_assistant_Process;

    constructor(private readonly _extensionUri: vscode.Uri) {
        this._extensionUri = _extensionUri;
    }

    public static readonly viewType = "treeView-item_AI";

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._webviewView = webviewView;

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

        // 初始化AI助手处理进程
        this._aiAssistantProcess = new TongYi_AI_assistant_Process(webviewView.webview);

        // 监听来自webview的消息
        this.setupMessageListener(webviewView);
    }

    private setupMessageListener(webviewView: vscode.WebviewView) {
        webviewView.webview.onDidReceiveMessage(
            async (message) => {
                if (this._aiAssistantProcess) {
                    await this._aiAssistantProcess.handleMessage(message);
                }
            },
            undefined
        );
    }

    // 发送消息到webview
    public postMessage(message: any) {
        if (this._webviewView) {
            this._webviewView.webview.postMessage(message);
        }
    }

    // 显示webview
    public show() {
        if (this._webviewView) {
            this._webviewView.show(true);
        }
    }
}

export class TongYi_AI_assistant_Process {
    private _webview: vscode.Webview;
    private _aiAssistant?: TONGYI_AIAssistant;
    private _apiKey = ALI_TONGYI_API_KEY;
    private _apiUrl = ALI_TONGYI_API_URL;
    private _currentModel: string = TongyiModel.get("ALI_TONGYI_MAX_MODEL")!;
    private _availableModels: Record<string, string> = {};
    private _modelId: string = "ALI_TONGYI_MAX_MODEL";
    constructor(webview: vscode.Webview) {
        this._webview = webview;
        this._availableModels = Object.fromEntries(TongyiModel);
        this.initializeAIAssistant();
    }
    public get AllAvailableModels() {
        return { ...this._availableModels };
    }
    private async initializeAIAssistant() {
        try {
            const apiKey = this._apiKey;

            // 初始化AI助手
            this._aiAssistant = new TONGYI_AIAssistant({
                model: this._currentModel,
                temperature: 0.7,
                maxTokens: 2000,
                url: this._apiUrl,
            }, apiKey);

            // 发送初始数据到前端
            this.sendInitialData();

        } catch (error) {
            console.error('初始化AI助手失败:', error);
            this.sendError('初始化AI助手失败，请检查配置');
        }
    }

    public async handleMessage(message: any) {
        try {
            switch (message.type) {
                // case 'getHistory':
                //     this.sendChatHistory();
                //     break;

                case 'getAvailableModels':
                    this.sendAvailableModels();
                    break;

                case 'getCurrentModel':
                    this.sendCurrentModel();
                    break;

                case 'sendMessage':
                    await this.handleSendMessage(message);
                    break;

                case 'setModel':
                    await this.handleSetModel(message);
                    break;

                // case 'clearHistory':
                //     this.handleClearHistory();
                //     break;

                case 'configureApiKey':
                    await this.resetConfigureApiKey();
                    break;

                default:
                    console.warn('未知的消息类型:', message.type);
            }
        } catch (error) {
            console.error('处理消息时出错:', error);
            this.sendError('处理消息时发生错误');
        }
    }

    private async handleSendMessage(message: any) {
        if (!this._aiAssistant) {
            this.sendError('AI助手未初始化');
            return;
        }

        const userMessage = message.content;
        if (!userMessage.trim()) {
            return;
        }

        // // 添加用户消息到历史记录
        // this._chatHistory.push({
        //     role: 'user',
        //     content: userMessage,
        //     timestamp: Date.now(),
        //     model: this._currentModel
        // });

        // // 发送更新后的历史记录
        // this.sendChatHistory();

        // 显示加载指示器
        this.sendLoading(true);

        try {
            // 准备发送给AI的消息格式
            const messages: ALI_TONGYI_Prompt_Messages[] = [
                {
                    role: 'system',
                    content: '你是一个专业的编程助手，帮助用户解决编程问题和提供代码建议。'
                },
                {
                    role: 'user',
                    content: userMessage
                }
            ];

            // 调用AI模型
            // const response = await this._aiAssistant.ChatMethod(messages);

            // 发送AI回复到前端
            // this.sendAIResponse(response);

            // 流式处理 - 实时接收响应
            const stream = this._aiAssistant.ChatMethodStream(messages);
            for await (const chunk of stream) {
                console.log('收到区块:', chunk);
                this.sendStreamingResponse(chunk);
            }


        } catch (error) {
            console.error('AI响应失败:', error);
            this.sendError('AI响应失败，请稍后重试');
        } finally {
            // 隐藏加载指示器
            this.sendLoading(false);
        }
    }

    private async handleSetModel(message: any) {
        const newModel: string = message.model;
        if (TongyiModel.get(newModel)) {
            this._currentModel = TongyiModel.get(newModel)!;
            this._modelId = newModel;
            // 重新初始化AI助手
            await this.initializeAIAssistant();

            // 发送当前模型信息
            this.sendCurrentModel();
        }
    }

    // private handleClearHistory() {
    //     this._chatHistory = [];
    //     this.sendChatHistory();
    // }

    private async resetConfigureApiKey() {
        const newApiKey = await vscode.window.showInputBox({
            prompt: '请输入新的通义千问API密钥',
            placeHolder: 'sk-...',
            ignoreFocusOut: true
        });

        if (newApiKey) {
            const config = vscode.workspace.getConfiguration('aiAssistant');
            await config.update('tongyiApiKey', newApiKey, vscode.ConfigurationTarget.Global);
            this._apiKey = newApiKey;
            // 重新初始化AI助手
            await this.initializeAIAssistant();

            vscode.window.showInformationMessage('API密钥已更新');
        }
    }

    // // 发送消息到前端的方法
    // private sendChatHistory() {
    //     this._webview.postMessage({
    //         type: 'chatHistory',
    //         history: this._chatHistory
    //     });
    // }

    private sendAvailableModels() {
        this._webview.postMessage({
            type: 'availableModels',
            models: this._availableModels
        });
    }

    private sendCurrentModel() {
        this._webview.postMessage({
            type: 'currentModel',
            model: this._modelId,
            displayName: this._currentModel
        });
    }

    private sendLoading(isLoading: boolean) {
        this._webview.postMessage({
            type: 'loading',
            isLoading: isLoading
        });
    }

    private sendError(errorMessage: string) {
        this._webview.postMessage({
            type: 'error',
            message: errorMessage
        });
    }

    private sendAIResponse(response: string) {
        this._webview.postMessage({
            type: 'aiResponse',
            content: response,
            model: this._currentModel,
            timestamp: Date.now()
        });
    }

    private sendStreamingResponse(chunk: string) {
        this._webview.postMessage({
            type: 'streamingResponse',
            content: chunk,
            model: this._currentModel,
            timestamp: Date.now()
        });
    }

    private sendInitialData() {
        this.sendAvailableModels();
        this.sendCurrentModel();
        // this.sendChatHistory();
    }
}