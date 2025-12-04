import * as vscode from 'vscode';

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
export function getMySqlConfig(): MySqlConfig[] {
    const config = vscode.workspace.getConfiguration();
    return config.get<MySqlConfig[]>('MySql.connection', []);
}

/**
 * 获取默认的MySQL配置
 * @returns 
 */
export function getDefaultMySqlConfig(): MySqlConfig | undefined {
    const configs = getMySqlConfig();
    return configs.length > 0 ? configs[0] : undefined;
}