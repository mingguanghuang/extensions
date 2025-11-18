// WebView 就绪检查函数
function waitForWebviewReady() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 最多尝试50次
        
        function checkReady() {
            attempts++;
            try {
                // 尝试获取 vscode API
                const vscode = acquireVsCodeApi();
                console.log('WebView 已就绪，尝试次数:', attempts);
                resolve(vscode);
            } catch (error) {
                if (attempts < maxAttempts) {
                    // 如果未就绪，等待100ms后重试
                    setTimeout(checkReady, 100);
                } else {
                    console.error('WebView 就绪超时:', error);
                    reject(new Error('WebView 初始化超时，请检查扩展是否正确加载'));
                }
            }
        }
        
        checkReady();
    });
}

// vscode 变量
let vscode = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM 内容加载完成，等待 WebView 就绪...');
    
    try {
        // 等待 WebView 就绪
        vscode = await waitForWebviewReady();
        console.log('WebView 已成功初始化！');
        
        // 设置更新日期
        const updateDateElement = document.getElementById('update-date');
        if (updateDateElement) {
            updateDateElement.textContent = new Date().toLocaleDateString('zh-CN');
        }
        
        // 添加页面加载完成的日志
        console.log('欢迎页面加载成功！');
        
        // 发送就绪消息到扩展
        vscode.postMessage({
            type: 'webviewReady',
            text: 'WebView 已就绪'
        });
        
    } catch (error) {
        console.error('页面初始化失败:', error);
        showNotification('页面初始化失败: ' + error.message, 'error');
    }
});


// 与VS Code扩展通信的函数
function vscodePostMessage(command) {
    if (command === 'hello') {
        vscode.postMessage({
            type: 'hello',
            text: '你好！欢迎使用我们的扩展！'
        });
        
        // 添加视觉反馈
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '✅ 已发送';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);
        
    } else if (command === 'close') {
        vscode.postMessage({
            type: 'close'
        });
        
        // 添加关闭动画
        const container = document.querySelector('.welcome-container');
        if (container) {
            container.style.transform = 'scale(0.95)';
            container.style.opacity = '0';
            container.style.transition = 'all 0.3s ease';
        }
        
        setTimeout(() => {
            // 这里可以添加关闭页面的逻辑
            console.log('关闭欢迎页面');
        }, 300);
    } 
}

// 监听来自扩展的消息
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
        case 'response':
            console.log('收到扩展的响应:', message.text);
            break;
            
        case 'info':
            console.log('扩展信息:', message.text);

            break;
            
        case 'error':
            console.error('扩展错误:', message.text);
            break;
            
        default:
            console.log('收到未知类型的消息:', message);
    }
});



// // 添加CSS动画样式
// const style = document.createElement('style');
// style.textContent = `
//     @keyframes slideIn {
//         from {
//             transform: translateX(100%);
//             opacity: 0;
//         }
//         to {
//             transform: translateX(0);
//             opacity: 1;
//         }
//     }
    
//     @keyframes slideOut {
//         from {
//             transform: translateX(0);
//             opacity: 1;
//         }
//         to {
//             transform: translateX(100%);
//             opacity: 0;
//         }
//     }
    
//     .notification {
//         box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
//     }
// `;

document.head.appendChild(style);

// 键盘快捷键支持
document.addEventListener('keydown', function(event) {
    // ESC键停用扩展
    if (event.key === 'Escape') {
        vscodePostMessage('close');
    }
    
    // H键打招呼
    if (event.key === 'h' || event.key === 'H') {
        if (event.ctrlKey || event.metaKey) {
            vscodePostMessage('hello');
        }
    }
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('页面被隐藏');
    } else {
        console.log('页面变为可见');
    }
});