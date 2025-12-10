import * as path from 'path';
import * as vscode from 'vscode';

let instance: ProjectPath;
export class ProjectPath { 
    static readonly sep = path.sep;
    static readonly WebViewUi = "webview-ui";
    static readonly AIAssistant = "AIAssistant"
    static readonly CreateProject = "CreateProject"
    static readonly ProjectType = "ProjectType"
    static readonly Welcome = "Welcome"

    static context: vscode.ExtensionContext;
     private constructor(context: vscode.ExtensionContext) {
        ProjectPath.context = context;
    }

    static getInstance(context: vscode.ExtensionContext): ProjectPath { 
        if (!instance) { 
            instance = new ProjectPath(context);
        }
        return instance;
    }
    /**
     * 获取扩展的根目录路径
     * @returns
     */
    static getExtensionPath(): string { 
        if(this.context){ 
            return this.context.extensionPath;
        }else{
            throw new Error("ProjectPath context is not set");
        }
    }

    static getWebViewUiPath(): string { 
        return this.getExtensionPath() + this.sep + this.WebViewUi;
    }
    static getAIAssistantPath(): string { 
        return this.getWebViewUiPath() + this.sep + this.AIAssistant;
    }
    static getCreateProjectPath(): string { 
        return this.getWebViewUiPath() + this.sep + this.CreateProject;
    }
    static getProjectTypePath(): string { 
        return this.getWebViewUiPath() + this.sep + this.ProjectType;
    }
    static getWelcomePath(): string { 
        return this.getWebViewUiPath() + this.sep + this.Welcome;
    }

}