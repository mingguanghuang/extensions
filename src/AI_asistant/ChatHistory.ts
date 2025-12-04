import { RedisChatMessageHistory } from "@langchain/redis";
import { createClient } from "redis";
import { TONGYI_AIAssistant } from "./AI_asistant";
import { BaseMessage } from "@langchain/core/messages";

export interface ChatHistoryConfig {
  sessionId: string;
  role: string;
  content: string;
}

export class ChatHistory{
    private redisClient: any;
    private history: RedisChatMessageHistory;

    constructor(private session: ChatHistoryConfig) {
        this.session = session;
        
        // 初始化redis客户端
        this.redisClient = createClient({
            url: process.env.REDIS_URL || "redis://localhost:6379"
        });
        
        // 获取会话历史并添加到redis缓存
        this.history = new RedisChatMessageHistory({
            sessionId: this.session.sessionId,
            client: this.redisClient
            // 移除了不存在的参数 numberOfGenerations
        });
    }

    // 连接到Redis服务器
    public async connect(): Promise<void> {
        if (!this.redisClient.isOpen) {
            await this.redisClient.connect();
        }
    }

    // 断开Redis连接
    public async disconnect(): Promise<void> {
        if (this.redisClient.isOpen) {
            await this.redisClient.disconnect();
        }
    }

    // 添加消息到历史记录
    public async addMessage(message: BaseMessage): Promise<void> {
        await this.connect();
        await this.history.addMessage(message);
    }

    // 获取历史消息
    public async getHistory(): Promise<BaseMessage[]> {
        await this.connect();
        return await this.history.getMessages();
    }

    // 清除历史记录
    public async clearHistory(): Promise<void> {
        await this.connect();
        await this.history.clear();
    }
}