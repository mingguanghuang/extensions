import * as vscode from 'vscode';
import* as path from 'path';
import * as fs from 'fs';
export function getLang(): any{
    const lang = vscode.env.language;
    let fileName = 'package.nls.json';
    if (lang != 'en'){
        fileName = 'package.nls.zh-CN.json';
    }
    
    // 获取扩展的根目录路径
    const extensionPath = path.join(__dirname, 'welcome-extension-plugin', '..');
    const filePath = path.join(extensionPath, fileName);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        console.error(`语言文件不存在: ${filePath}`);
        // 返回空对象作为默认值
        return {};
    }
    
    try {
        const LangTranslations = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(LangTranslations);
    } catch (error) {
        console.error(`读取语言文件失败: ${filePath}`, error);
        return {};
    }
}