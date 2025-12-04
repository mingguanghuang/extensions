import { ModelConfig, ALI_TONGYI_API_KEY, ModelBase } from './model_config';
import { ChatOpenAI, ChatOpenAICallOptions } from '@langchain/openai';
import { BaseMessage, SystemMessage, HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { getRetrievalResults } from '../api/api';
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { RedisUsing} from './RedisUsing';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';


let systemMessage = "你是一个专业的编程助手，帮助用户解决编程问题和提供代码建议。";

export class TONGYI_AIAssistant extends ModelBase {
  public apiKey: string = ALI_TONGYI_API_KEY!;
  private outputParser: StringOutputParser;
  constructor(options: ModelConfig, apiKey: string) {
    super(options);
    this.apiKey = apiKey;
    this.outputParser = new StringOutputParser();

  }

  public chatModel: ChatOpenAI<ChatOpenAICallOptions> = new ChatOpenAI({
    apiKey: this.apiKey,
    modelName: this.model,
    temperature: this.temperature,
    maxTokens: this.maxTokens,
    configuration: {
      baseURL: this.url,
    },
    streaming: true,
  });

  public async ChatMethod(userMessage: string): Promise<string> {

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemMessage],
      new MessagesPlaceholder("history"), // 此处将自动注入历史消息
      ["human", "{input}"],
    ]);

    // 使用输出解析器处理非流式响应
    const response = await prompt.pipe(this.chatModel).pipe(this.outputParser).invoke({
      input: userMessage
    });

    return response;
  }

  /**
   * 流式聊天方法 - 实时返回AI响应区块
   * @param messages 消息数组
   * @returns 异步生成器，实时返回响应区块
   */
  public async *ChatMethodStreamWithRAG(userMessage: string, sessionId: string): AsyncGenerator<string> {
    let retrievalContent = '';
    try {
      const results = await getRetrievalResults(userMessage);
      if (Array.isArray(results)) {
        retrievalContent = results.map(result => result.content).join('\n');
      }
    } catch (error) {
      console.error('获取检索结果失败:', error);
    }

    if (retrievalContent) {
        systemMessage = `${systemMessage}\n\n请参考以下内容回答问题:\n${retrievalContent}`;
    }
    let prompt = ChatPromptTemplate.fromMessages([
      ["system", systemMessage],
      new MessagesPlaceholder("history"), // 此处将自动注入历史消息
      ["human", "{input}"],
    ]);
    // 创建聊天历史记录实例
    const chatHistory = new RedisUsing(sessionId);

    // 创建带历史记录的可运行链
    const chain = new RunnableWithMessageHistory({
      runnable: prompt.pipe(this.chatModel).pipe(this.outputParser),
      getMessageHistory: (_sessionId: string) => chatHistory.history,
      inputMessagesKey: "input",
      historyMessagesKey: "history",
    });

    // 实时返回每个区块
    const stream = await chain.stream({
      input: userMessage
    }, {
      configurable: {
        sessionId: sessionId
      }
    });

    for await (const chunk of stream) {
      if (chunk) {
        yield chunk;
      }
    }
  }
}