import * as vscode from 'vscode';
import { getHtmlForWebview } from './webview';
import { TongyiModel, ALI_TONGYI_API_URL } from '../config/model_config';
import { TONGYI_AIAssistant } from '../AI_asistant/AI_asistant';
import { ProjectPath } from '../ProjectPath';
import { UserManager } from '../api/UserLogin';
import { ALI_TONGYI_API_KEY } from '../config/env';

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
        const htmlContent = getHtmlForWebview(webviewView.webview, ProjectPath.AIAssistant);
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
    private _currentSessionId: string; // 添加当前会话ID属性
    private _userManager: UserManager; // 添加 UserManager 实例
    constructor(webview: vscode.Webview) {
        this._webview = webview;
        this._availableModels = Object.fromEntries(TongyiModel);
        this._currentSessionId = this.generateUniqueSessionId(); // 初始化会话ID
        this.initializeAIAssistant();
        this._userManager = new UserManager(); // 初始化 UserManager
        this._userManager.initMySqlDatabase();
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

                case 'newSession': // 添加处理新会话的消息类型
                    this.handleNewSession();
                    break;

                case 'configureApiKey':
                    await this.resetConfigureApiKey();
                    break;

                case 'requestVerificationCode':
                    await this.handleRequestVerificationCode(message);
                    break;

                case 'register':
                    await this.handleRegister(message);
                    break;

                case 'login':
                    await this.handleLogin(message);
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

        // 显示加载指示器
        this.sendLoading(true);
        try {
            // 流式处理 - 实时接收响应，使用固定的会话ID
            const stream = this._aiAssistant.ChatMethodStreamWithRAG(userMessage, this._currentSessionId);
            for await (const chunk of stream) {
                this.sendStreamingResponse(chunk);
            }
            this.sendSessionEnd();

        } catch (error) {
            console.error('AI响应失败:', error);
            this.sendError('AI响应失败，请稍后重试');
            this.sendSessionEnd();
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
    // 发送会话结束消息，用于结束一次问题回答，不会重置会话ID
    private sendSessionEnd() {
        this._webview.postMessage({
            type: 'sessionEnd',
            content: "------会话结束------",
            model: this._currentModel,
            timestamp: Date.now(),
        });
    }

    // 添加生成唯一会话ID的方法
    private generateUniqueSessionId(): string {
        const timestamp = Date.now();
        // const userName = this._userManager.getCurrentUserInfo().then(userInfo => userInfo.name);
        return `session_user_${timestamp}`;
    }

    // 添加重置会话ID的方法，用于创建新对话
    public resetSessionId(): void {
        this._currentSessionId = this.generateUniqueSessionId();
    }

    // 添加处理新会话的方法
    private handleNewSession() {
        this.resetSessionId();
        // 可以发送一个确认消息给前端表示会话已重置
        this._webview.postMessage({
            type: 'sessionReset',
            message: '新会话已创建'
        });
    }

    private sendInitialData() {
        this.sendAvailableModels();
        this.sendCurrentModel();
        // this.sendChatHistory();
    }

    private async handleRequestVerificationCode(message: any) {
        try {
            const { email } = message;
            await this._userManager.getVerificationCode(email);

            // 发送成功消息到前端
            this._webview.postMessage({
                type: 'verificationCodeSent',
                message: '验证码已发送到您的邮箱'
            });
        } catch (error) {
            console.error('获取验证码失败:', error);
            this.sendError('获取验证码失败: ' + (error as Error).message);
        }
    }

    private async handleRegister(message: any) {
        try {
            const { email, password, verificationCode } = message;
            const result = await this._userManager.register(email, password, verificationCode);

            // 发送注册成功消息到前端
            this._webview.postMessage({
                type: 'registrationSuccess',
                token: result.token,
                userId: result.userId,
                message: '注册成功'
            });
        } catch (error) {
            console.error('注册失败:', error);
            this.sendError('注册失败: ' + (error as Error).message);
        }
    }

    private async handleLogin(message: any) {
        try {
            const { email, password } = message;
            const result = await this._userManager.login(email, password);

            // 发送登录成功消息到前端
            this._webview.postMessage({
                type: 'loginSuccess',
                token: result.token,
                userId: result.userId,
                message: '登录成功'
            });
        } catch (error) {
            console.error('登录失败:', error);
            this.sendError('登录失败: ' + (error as Error).message);
        }
    }

    // 添加登出处理方法
    private async handleLogout() {
        this._userManager.clearToken();
        // 通知前端登出成功
        this._webview.postMessage({
            type: 'logoutSuccess',
            message: '已成功登出'
        });
    }
    // 添加检查认证状态的方法
    private async checkAuthStatus() {
        try {
            const isValid = await this._userManager.verifyToken();
            this._webview.postMessage({
                type: 'authStatus',
                isAuthenticated: isValid,
                message: isValid ? '用户已认证' : '用户未认证'
            });
        } catch (error) {
            this._userManager.clearToken();
            this.sendError('认证检查失败: ' + (error as Error).message);
        }
    }

}