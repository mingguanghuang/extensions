
// 全局 vscode 变量
const vscode = acquireVsCodeApi();

// 与VS Code扩展通信的函数
function PostMessage(command) {
    if (!vscode) {
        console.error('vscode API 未初始化，请等待页面加载完成');
        return;
    }

    console.log('按钮事件监听器已初始化，命令:', command);
    
    if (command === 'openFolder') {
        vscode.postMessage({
            type: 'openFolder'
        });
        console.log('发送打开文件夹消息');

    } else if (command === 'createProject') {
        vscode.postMessage({
            type: 'createProject'
        });
        console.log('发送创建项目消息');
    } else {
        console.log('未知命令:', command);
    }
}