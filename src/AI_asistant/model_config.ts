// 通义千问API相关常量
import * as vscode from 'vscode';
import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';



//加载环境变量
dotenv.config();
export const ALI_TONGYI_API_KEY = process.env.DASHSCOPE_API_KEY || "";

export const ALI_TONGYI_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
// 通义千问模型映射
export const TongyiModel: Map<string, string> = new Map([
    ["ALI_TONGYI_MAX_MODEL", "qwen-max-latest"],
    ["ALI_TONGYI_DEEPSEEK_R1", "deepseek-r1"],
    ["ALI_TONGYI_DEEPSEEK_V3", "deepseek-v3"],
    ["ALI_TONGYI_REASONER_MODEL", "qvq-max-latest"],
    ["ALI_TONGYI_EMBEDDING_MODEL", "text-embedding-v3"],
    ["ALI_TONGYI_RERANK_MODEL", "gte-rerank-v2"],

])
//模型接口，所用模型的使用应该从该接口中继承过去
export interface ModelConfig {
    model: string;
    url?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
}

//模型提示词，所有模型的提示词都应从该接口继承
export interface modelPrompt{
    role: "system" | "user" | "assistant" | "tool";
    content: string;
}

//通义千问助手额外字段
export interface ALI_AssistantExtras extends modelPrompt{
    partial?: boolean;
    tool_calls?: {
        id: string;
        type: string;
        function: {
            name: string;
            arguments: string;
        };
    }[];
}
//通义千问工具额外字段
export interface ALI_ToolExtras extends modelPrompt{
    tool_call_id: string;

}
//通义千问模型提示消息类型
export type ALI_TONGYI_Prompt_Messages = 
  | (modelPrompt & { role: "assistant" } & ALI_AssistantExtras)
  | (modelPrompt & { role: "tool" } & ALI_ToolExtras)
  | (modelPrompt & { role: "system" | "user" });

/**
 * 需要实现的模型类，所有模型类都需要从该类继承
 * @param model 模型名称
 * @param url 模型URL（可选）
 * @param maxTokens 最大令牌数（可选）
 * @param temperature 温度（可选）
 * @param topP topP（可选）
 */

export abstract class ModelBase implements ModelConfig{
    public readonly model: string;
    public readonly url?: string;
    public readonly maxTokens?: number;
    public readonly temperature?: number;
    public readonly topP?: number;
    constructor(opt: ModelConfig) { 
        this.model = opt.model;
        this.url = opt.url;
        this.maxTokens = opt.maxTokens;
        this.temperature = opt.temperature;
        this.topP = opt.topP;
    };
  
    // 模型实例,在子类方法中实现
    public abstract chatModel: ChatOpenAI;
    // 模型消息发送，具体方法在子类中实现
    public abstract ChatMethod(messages: ALI_TONGYI_Prompt_Messages[]): Promise<string>;
}
