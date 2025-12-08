import * as mysql from 'mysql2/promise';
import { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } from '../config/env';


export interface MySqlConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}

/**
 * 获取MySQL配置
 * @returns MySql配置数组
 */
export function getMySqlConfig(): MySqlConfig {

    // 从环境变量中提取MySQL配置
    const config: MySqlConfig = {
        host: MYSQL_HOST,
        port: parseInt(MYSQL_PORT),
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE,
    };

    return config;
}



/**
  * 初始化数据库连接
  */
export async function  initDatabase(dbConfig: MySqlConfig): Promise <mysql.Connection> {
    try {
       const connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database
        });
        console.log('数据库连接成功');
        return connection;
    } catch (error) {
        console.error('数据库连接失败:', error);
        throw error;
    }


  }