import { RedisChatMessageHistory } from "@langchain/redis";
import { createClient } from "redis";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

export const REDIS_URL = "redis://127.0.0.1:6379";
export class RedisUsing{
    private redisClient: any;
    public history: RedisChatMessageHistory;

    constructor(private sessionId: string) {
        this.sessionId = sessionId;
        
        // 初始化redis客户端
        this.redisClient = createClient({
            url: REDIS_URL,
        });
        
        // 获取会话历史并添加到redis缓存
        this.history = new RedisChatMessageHistory({
            sessionId: this.sessionId,
            client: this.redisClient,
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

    // 添加用户消息到历史记录
    public async addUserMessage(content: string): Promise<void> {
        await this.connect();
        const message = new HumanMessage(content);
        await this.history.addMessage(message);
    }

    // 添加AI消息到历史记录
    public async addAIMessage(content: string): Promise<void> {
        await this.connect();
        const message = new AIMessage(content);
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

    public async DeleteEarliestHistory(): Promise<void> {
        await this.connect();
       
    }
}