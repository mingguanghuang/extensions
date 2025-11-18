import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// 定义树视图项的数据模型
/**
 * @deprecated 已废弃，使用 vscode.TreeItem 替代
 */
interface TreeViewItem {
    id: string;
    label: string;
    collapsibleState: vscode.TreeItemCollapsibleState;
    children?: TreeViewItem[];
    iconPath?: vscode.ThemeIcon;
    command?: vscode.Command;
    contextValue?: string;
    resourceUri?: vscode.Uri;
}

export class TreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly itemType?: string,
        public readonly contextValue?: string,
        public readonly resourceUri?: vscode.Uri
    ) {
        super(label, collapsibleState);
        
        // 设置资源URI（用于文件/文件夹）
        if (resourceUri) {
            this.resourceUri = resourceUri;
            this.command = {
                command: 'vscode.open',
                title: '打开文件',
                arguments: [resourceUri]
            };
        }
        
        // 设置上下文值
        if (contextValue) {
            this.contextValue = contextValue;
        }
        
        // 根据项目类型设置不同的图标
        if (itemType) {
            switch (itemType) {
                case 'file':
                    this.iconPath = new vscode.ThemeIcon('file');
                    this.tooltip = `文件：${label}`;
                    break;
                case 'folder':
                    this.iconPath = new vscode.ThemeIcon('folder');
                    this.tooltip = `文件夹：${label}`;
                    break;
            }
        }
    }
}

export class FileTreeViewProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    // 当前打开的项目文件夹路径
    private currentWorkspaceFolders: readonly vscode.WorkspaceFolder[] = [];
    
    constructor() {
        // 监听工作区文件夹变化
        if (vscode.workspace.onDidChangeWorkspaceFolders) {
            vscode.workspace.onDidChangeWorkspaceFolders(() => {
                this.updateWorkspaceFolders();
                this.updateContext();
                this.refresh();
            });
        }
        
        // 初始化当前工作区文件夹
        this.updateWorkspaceFolders();
        this.updateContext();
    }

    // 更新工作区文件夹信息
    private updateWorkspaceFolders(): void {
        this.currentWorkspaceFolders = vscode.workspace.workspaceFolders || [];
    }
    
    // 更新上下文变量
    private updateContext(): void {
        const hasOpenFolder = this.currentWorkspaceFolders.length > 0;
        vscode.commands.executeCommand('setContext', 'is.open.folder', hasOpenFolder);
    }
    
    getTreeItem(element: TreeItem): TreeItem {
        return element;
    }
    
    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (element) {
            if (element.itemType === 'folder' && element.resourceUri) {
                return Promise.resolve(this.getFolderContents(element.resourceUri.fsPath));
            }
            return Promise.resolve([]);
        } else {
            const rootItems: TreeItem[] = [];
            
            if (this.currentWorkspaceFolders.length > 0) {
                // 有打开的工作区文件夹时，显示项目文件夹（名称大写）
                this.currentWorkspaceFolders.forEach((folder, index) => {
                    const folderName = path.basename(folder.uri.fsPath).toUpperCase();
                    rootItems.push(new TreeItem(
                        folderName, 
                        vscode.TreeItemCollapsibleState.Collapsed, 
                        'folder', 
                        'folder', 
                        folder.uri
                    ));
                });
            }
            return Promise.resolve(rootItems);
        }
    }

    private getFolderContents(folderPath: string): TreeItem[] {
        try {
            const items: TreeItem[] = [];
            if (fs.existsSync(folderPath)) {
                const entries = fs.readdirSync(folderPath, { withFileTypes: true });

                // 先显示文件夹，再显示文件
                entries.filter(entry => entry.isDirectory()).forEach(entry => {
                    items.push(new TreeItem(
                        entry.name, 
                        vscode.TreeItemCollapsibleState.Collapsed, 
                        'folder', 
                        'folder', 
                        vscode.Uri.file(path.join(folderPath, entry.name))
                    ));
                });
                
                entries.filter(entry => entry.isFile()).forEach(entry => {
                    items.push(new TreeItem(
                        entry.name, 
                        vscode.TreeItemCollapsibleState.None, 
                        'file', 
                        'file', 
                        vscode.Uri.file(path.join(folderPath, entry.name))
                    ));
                });
            }
            return items;
        } catch (error) {
            console.error('读取文件夹内容失败', error);
            return [new TreeItem('无法读取文件内容', vscode.TreeItemCollapsibleState.None, 'error')];
        }
    }
    
    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    // 刷新特定项目
    refreshProject(projectPath: string): void {
        this.refresh();
    }
}