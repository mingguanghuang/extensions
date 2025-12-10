import dotenv from 'dotenv';
import path from 'path';


// 在 CommonJS 中，直接使用 __dirname
const projectRoot = path.resolve(__dirname, '../..');
const envPath = path.join(projectRoot, '.env');

dotenv.config({ path: envPath });

export const ALI_TONGYI_API_KEY = process.env.DASHSCOPE_API_KEY || "";
export const apiKey = process.env.RAGFLOW_API_KEY || "";
export const COMPANY_SET = process.env.COMPANY_SET || "";
export const COMPANY_SET_DOC = process.env.COMPANY_SET_DOC || "";
export const MYSQL_HOST = process.env.MYSQL_HOST || "";
export const MYSQL_PORT = process.env.MYSQL_PORT || "";
export const MYSQL_USER = process.env.MYSQL_USER || "";
export const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || "";
export const MYSQL_DATABASE = process.env.MYSQL_DATABASE || "";