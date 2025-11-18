// AI助手前端JavaScript逻辑
class AIAssistantFrontend {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.modelSelect = document.getElementById('modelSelect');
        this.currentModelDisplay = document.getElementById('currentModelDisplay');
        this.isLoading = false;
        this.currentModel = 'qwen-max';
        this.availableModels = {};
        
        this.initializeEventListeners();
        this.requestInitialData();
    }

    initializeEventListeners() {
        // 监听来自VS Code的消息
        window.addEventListener('message', (event) => {
            const message = event.data;
            this.handleVSCodeMessage(message);
        });

        // 输入框自动调整高度
        this.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
        });

        // 发送按钮点击事件
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // 输入框回车事件
        this.messageInput.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });

        // 模型选择事件
        if (this.modelSelect) {
            this.modelSelect.addEventListener('change', (event) => {
                this.changeModel(event.target.value);
            });
        }

        // 配置API密钥按钮
        const configureApiKeyBtn = document.getElementById('configureApiKeyBtn');
        if (configureApiKeyBtn) {
            configureApiKeyBtn.addEventListener('click', () => {
                this.configureApiKey();
            });
        }

        // 清除历史按钮
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearHistory();
            });
        }
    }

    handleVSCodeMessage(message) {
        switch (message.type) {
            case 'chatHistory':
                this.displayChatHistory(message.history);
                break;
                
            case 'loading':
                this.showLoadingIndicator(message.messageId);
                break;
                
            case 'error':
                this.showError(message.message);
                break;
                
            case 'chatUpdate':
                this.displayChatHistory(message.history);
                break;

            case 'availableModels':
                this.updateAvailableModels(message.models);
                break;

            case 'currentModel':
                this.updateCurrentModel(message.model, message.displayName);
                break;
        }
    }

    displayChatHistory(history) {
        this.chatMessages.innerHTML = '';
        
        if (history && history.length > 0) {
            history.forEach(message => {
                this.addMessageToChat(message);
            });
        } else {
            this.addWelcomeMessage();
        }
        
        this.scrollToBottom();
    }

    addMessageToChat(message) {
        const messageElement = this.createMessageElement(message);
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        
        const roleSpan = document.createElement('span');
        roleSpan.className = 'message-role';
        roleSpan.textContent = message.role === 'user' ? '您' : 'AI助手';
        
        const modelSpan = document.createElement('span');
        modelSpan.className = 'message-model';
        modelSpan.textContent = message.model ? ` (${this.getModelDisplayName(message.model)})` : '';
        
        headerDiv.appendChild(roleSpan);
        headerDiv.appendChild(modelSpan);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message.content;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.formatTime(message.timestamp);
        
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        
        return messageDiv;
    }

    createLoadingElement() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant loading';
        loadingDiv.id = 'loadingMessage';
        
        const loadingText = document.createElement('span');
        loadingText.textContent = 'AI正在思考';
        
        const dotsDiv = document.createElement('div');
        dotsDiv.className = 'loading-dots';
        dotsDiv.innerHTML = '<span></span><span></span><span></span>';
        
        loadingDiv.appendChild(loadingText);
        loadingDiv.appendChild(dotsDiv);
        
        return loadingDiv;
    }

    showLoadingIndicator(messageId) {
        this.isLoading = true;
        this.sendButton.disabled = true;
        
        const loadingElement = this.createLoadingElement();
        this.chatMessages.appendChild(loadingElement);
        this.scrollToBottom();
    }

    hideLoadingIndicator() {
        this.isLoading = false;
        this.sendButton.disabled = false;
        
        const loadingElement = document.getElementById('loadingMessage');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    showError(errorMessage) {
        this.hideLoadingIndicator();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = errorMessage;
        
        this.chatMessages.appendChild(errorDiv);
        this.scrollToBottom();
    }

    addWelcomeMessage() {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'message assistant';
        welcomeDiv.innerHTML = `
            <div class="message-content">
                您好！我是AI助手，基于通义千问模型。我可以帮助您解答编程问题、提供代码建议等。
            </div>
        `;
        this.chatMessages.appendChild(welcomeDiv);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    sendMessage() {
        const content = this.messageInput.value.trim();
        if (content && !this.isLoading) {
            // 清空输入框
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
            
            // 发送消息到VS Code扩展
            vscode.postMessage({
                type: 'sendMessage',
                content: content,
                model: this.currentModel
            });
        }
    }

    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    clearHistory() {
        vscode.postMessage({
            type: 'clearHistory'
        });
    }

    configureApiKey() {
        vscode.postMessage({
            type: 'configureApiKey'
        });
    }

    requestInitialData() {
        vscode.postMessage({
            type: 'getHistory'
        });
        vscode.postMessage({
            type: 'getModels'
        });
        vscode.postMessage({
            type: 'getCurrentModel'
        });
    }

    // 模型管理相关方法
    updateAvailableModels(models) {
        this.availableModels = models;
        this.populateModelSelect();
    }

    populateModelSelect() {
        if (!this.modelSelect) return;
        
        this.modelSelect.innerHTML = '';
        
        Object.entries(this.availableModels).forEach(([modelId, displayName]) => {
            const option = document.createElement('option');
            option.value = modelId;
            option.textContent = displayName;
            this.modelSelect.appendChild(option);
        });
        
        // 设置当前选中的模型
        this.modelSelect.value = this.currentModel;
    }

    updateCurrentModel(model, displayName) {
        this.currentModel = model;
        
        if (this.modelSelect) {
            this.modelSelect.value = model;
        }
        
        if (this.currentModelDisplay) {
            this.currentModelDisplay.textContent = displayName || this.getModelDisplayName(model);
        }
    }

    changeModel(modelId) {
        if (modelId && modelId !== this.currentModel) {
            vscode.postMessage({
                type: 'setModel',
                model: modelId
            });
        }
    }

    getModelDisplayName(modelId) {
        return this.availableModels[modelId] || modelId;
    }
}

// 初始化AI助手前端
let aiAssistant;
window.addEventListener('DOMContentLoaded', () => {
    aiAssistant = new AIAssistantFrontend();
});

// VS Code API
const vscode = acquireVsCodeApi();