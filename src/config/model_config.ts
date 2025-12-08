// 通义千问API相关常量

import { ChatOpenAI } from '@langchain/openai';

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
    public abstract ChatMethod(userMessage: string): Promise<string>;
}
