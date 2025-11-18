import * as vscode from 'vscode';
import ('node-fetch');
// 通义千问API相关常量
export const ALI_TONGYI_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
export const ALI_TONGYI_MAX_MODEL = "qwen-max-latest";
export const ALI_TONGYI_DEEPSEEK_R1 = "deepseek-r1";
export const ALI_TONGYI_DEEPSEEK_V3 = "deepseek-v3";
export const ALI_TONGYI_REASONER_MODEL = "qvq-max-latest";
export const ALI_TONGYI_EMBEDDING_MODEL = "text-embedding-v3";
export const ALI_TONGYI_RERANK_MODEL = "gte-rerank-v2";

// 模型类型定义
export type TongyiModel = 
    | "qwen-turbo"
    | "qwen-plus" 
    | "qwen-max"
    | "qwen-max-latest"
    | "deepseek-r1"
    | "deepseek-v3"
    | "qvq-max-latest"
    | "text-embedding-v3"
    | "gte-rerank-v2";

// 默认模型配置
export const DEFAULT_MODEL: TongyiModel = "qwen-max";

// 可用模型映射
export const AVAILABLE_MODELS: Record<TongyiModel, string> = {
    "qwen-turbo": "Qwen Turbo (快速)",
    "qwen-plus": "Qwen Plus (增强)",
    "qwen-max": "Qwen Max (最强)",
    "qwen-max-latest": "Qwen Max Latest (最新)",
    "deepseek-r1": "DeepSeek R1 (推理)",
    "deepseek-v3": "DeepSeek V3 (最新)",
    "qvq-max-latest": "QVQ Max (推理增强)",
    "text-embedding-v3": "Text Embedding V3 (嵌入)",
    "gte-rerank-v2": "GTE Rerank V2 (重排序)"
};

export interface TongyiMessage {
    role: 'user' | 'system';
    content: string;
}

export interface TongyiResponse {
    output: {
        text: string;
        finish_reason: string;
    };
    usage: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
    };
}

export class TongyiAPI {
    private apiKey: string | undefined;
    private baseUrl = ALI_TONGYI_URL;

    constructor() {
        this.loadApiKey();
    }

    private async loadApiKey(): Promise<void> {
        // 从VS Code配置中获取API密钥
        const config = vscode.workspace.getConfiguration('aiAssistant');
        this.apiKey = config.get<string>('tongyiApiKey');
        
        if (!this.apiKey) {
            vscode.window.showWarningMessage('请先配置通义千问API密钥：设置 -> AI助手 -> 通义千问API密钥');
        }
    }

    public async setApiKey(apiKey: string): Promise<void> {
        this.apiKey = apiKey;
        // 保存到VS Code配置
        const config = vscode.workspace.getConfiguration('aiAssistant');
        await config.update('tongyiApiKey', apiKey, vscode.ConfigurationTarget.Global);
    }

    public async sendMessage(messages: TongyiMessage[], model: TongyiModel = DEFAULT_MODEL): Promise<TongyiResponse> {
        if (!this.apiKey) {
            throw new Error('API密钥未配置，请先在设置中配置通义千问API密钥');
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-DashScope-Async': 'enable'
                },
                body: JSON.stringify({
                    model: model,
                    input: {
                        messages: messages
                    },
                    parameters: {
                        result_format: 'message'
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API请求失败: ${response.status} - ${errorText}`);
            }

            const data = await response.json() as TongyiResponse;
            return data;
        } catch (error) {
            console.error('通义千问API调用失败:', error);
            throw new Error(`API调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    public async quickChat(prompt: string, model: TongyiModel = DEFAULT_MODEL): Promise<string> {
        const messages: TongyiMessage[] = [
            {
                role: 'user',
                content: prompt
            }
        ];

        try {
            const response = await this.sendMessage(messages, model);
            return response.output.text;
        } catch (error) {
            throw error;
        }
    }

    // 获取可用模型列表
    public getAvailableModels(): Record<TongyiModel, string> {
        return AVAILABLE_MODELS;
    }
}