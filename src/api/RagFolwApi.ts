import axios from 'axios';
import { COMPANY_SET, COMPANY_SET_DOC, apiKey } from '../config/env';
/**
 * 该文件主要实现http请求信息的封装
 */

const RAGFlowUrl = 'http://localhost:80';

// 定义响应数据结构
export interface Chunk {
    content: string;
    content_ltks: string;
    document_id: string;
    document_keyword: string;
    highlight: string;
    id: string;
    image_id: string;
    important_keywords: string[];
    kb_id: string;
    positions: string[];
    similarity: number;
    term_similarity: number;
    vector_similarity: number;
}

export interface DocAgg {
    count: number;
    doc_id: string;
    doc_name: string;
}

export interface RetrievalResponse {
    code: number;
    data: {
        chunks: Chunk[];
        doc_aggs: DocAgg[];
        total: number;
    };
}

export interface enableRetrievalRequest {
    question: string,
    dataset_ids: string[],
    document_ids: string[],
    page?: number,
    page_size?: number,
    similarity_threshold?: number,
    vector_similarity_weight?: number,
    top_k?: number,
    rerank_id?: string,
    keyword?: boolean,
    highlight?: boolean,
    cross_languages?: string[],
    metadata_condition?: object,
    use_kg?: boolean,
    toc_enhance?: boolean
}


export async function postRequest(requestBody: enableRetrievalRequest) {
    const url = `${RAGFlowUrl}/api/v1/retrieval`;

    try {
        const response = await axios.post(url, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });
        const result: RetrievalResponse = response.data;
        return result;
    } catch (error: any) {
        console.error('请求失败:', error.message || error);
        throw error;
    }
}

// 获取检索结果的方法
export async function getRetrievalResults(question: string): Promise<Chunk[]> {
    try {
        const requestBody: enableRetrievalRequest = {
            question: question,
            dataset_ids: [COMPANY_SET],
            document_ids: [COMPANY_SET_DOC],
            page: 1,
            page_size: 10,
            similarity_threshold: 0.5,
            vector_similarity_weight: 0.5,
            top_k: 10,
            keyword: true,
            highlight: true,
            cross_languages: ['zh'],
            use_kg: false,
            toc_enhance: false
        }
        const response = await postRequest(requestBody);

        // 检查响应是否成功
        if (response.code === 0) {
            // 返回匹配的块内容
            return response.data.chunks;
        } else {
            throw new Error(`检索失败，错误代码: ${response.code}`);
        }
    } catch (error) {
        console.error('获取检索结果失败:', error);
        throw error;
    }
}

