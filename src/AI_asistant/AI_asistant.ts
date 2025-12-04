import { ModelConfig ,ALI_TONGYI_API_KEY, ALI_TONGYI_Prompt_Messages,ModelBase} from './model_config';
import { ChatOpenAI, ChatOpenAICallOptions } from '@langchain/openai';
import { BaseMessage,SystemMessage, HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { getRetrievalResults } from '../api/api';

export class TONGYI_AIAssistant extends ModelBase{
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
  
  private convertToLangChainMessages(messages: ALI_TONGYI_Prompt_Messages[], retrievalContent?: string): BaseMessage[] {
  if (retrievalContent) {
    const modifiedMessages = [...messages];
    if (modifiedMessages.length > 0 && modifiedMessages[0].role === 'system') {
      modifiedMessages[0] = {
        ...modifiedMessages[0],
        content: `${modifiedMessages[0].content}\n\n请根据以下内容回答问题:\n${retrievalContent}`
      };
    }
    messages = modifiedMessages;
  }

  return messages.map(msg => {
    switch (msg.role) {
      case 'user':
      case 'system':
        // 系统和用户消息比较简单，直接使用 content 创建
        return msg.role === 'system' 
          ? new SystemMessage(msg.content)
          : new HumanMessage(msg.content);

      case 'assistant':
        // 处理助手消息，可能包含工具调用 (tool_calls)
        const assistantMsgPayload: any = {
          content: msg.content
        };
        // 如果存在工具调用定义，将其转换为 AIMessage 支持的格式
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          assistantMsgPayload.tool_calls = msg.tool_calls.map(tc => ({
            id: tc.id, 
            type: tc.type,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          }));
        }
        // 注意：这里可能需要根据 LangChain 的 AIMessage 实际构造函数调整
        // 某些版本可能需要使用 .bind_tools 等方式，但直接传入 payload 是常见做法
        return new AIMessage(assistantMsgPayload);

      case 'tool':
        // 处理工具返回消息
        return new ToolMessage({
          content: msg.content,
          tool_call_id: msg.tool_call_id, 
        });

      default:
        // 为保障类型安全，这里可以抛出错误或进行默认处理
        throw new Error(`Unsupported message role: ${(msg as any).role}`);
    }
  });
}
  public async ChatMethod(messages: ALI_TONGYI_Prompt_Messages[]): Promise<string>{
    const format_msg = this.convertToLangChainMessages(messages);
    
    // 使用输出解析器处理非流式响应
    const response = await this.chatModel.pipe(this.outputParser).invoke(format_msg);
        
    return response;
  }

  /**
   * 流式聊天方法 - 实时返回AI响应区块
   * @param messages 消息数组
   * @returns 异步生成器，实时返回响应区块
   */
  public async *ChatMethodStreamWithRAG(messages: ALI_TONGYI_Prompt_Messages[]): AsyncGenerator<string> {
    let retrievalContent = '';
    try {
      const results = await getRetrievalResults(messages[1].content);
      if (Array.isArray(results)) {
        retrievalContent = results.map(result => result.content).join('\n');
      }
    } catch (error) {
      console.error('获取检索结果失败:', error);  
    }
    
    // 使用输出解析器处理流式响应
    const format_msg = this.convertToLangChainMessages(messages, retrievalContent);
    const stream = await this.chatModel.pipe(this.outputParser).stream(format_msg);
    
    // 实时返回每个区块
    for await (const chunk of stream) {
      if (chunk) {
        yield chunk;
      }
    }
  }
}