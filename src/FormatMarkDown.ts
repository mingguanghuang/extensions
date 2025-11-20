import {marked} from "marked";

/*=====================================================================
  markdownRenderer.ts
  说明：
    - 提供 MarkdownBuilder：把普通文字快速转成 Markdown 格式。
    - 提供 MarkdownTemplateRenderer：渲染 {{placeholder}} 模板并自动
      对占位符使用 MarkdownBuilder.bold 包装（即 **name**）。
    -（可选）使用 marked 将 Markdown 再转成 HTML，帮助你在 VS Code
      Webview、Electron、Node‑express 等环境直接展示。
=====================================================================*/



export class MarkdownBuilder {
  /** 粗体：**text** */
  static bold(text: string): string {
    return `**${text}**`;
  }

  /** 斜体：*text* */
  static italic(text: string): string {
    return `*${text}*`;
  }

  /** 行内代码：`text` */
  static inlineCode(text: string): string {
    return `\`${text}\``;
  }

  /** 代码块（可选语言） */
  static codeBlock(code: string, language = ''): string {
    return `\`\`\`${language}
${code}
\`\`\``;
  }

  /** 超链接：[title](url) */
  static link(title: string, url: string): string {
    return `[${title}](${url})`;
  }

  /** 图片：![alt](url) */
  static image(alt: string, url: string): string {
    return `![${alt}](${url})`;
  }

  /** 标题：#、##、... */
  static header(text: string, level: number = 1): string {
    const safeLevel = Math.min(Math.max(level, 1), 6);
    return `${'#'.repeat(safeLevel)} ${text}`;
  }

  /** 无序列表 */
  static unorderedList(items: string[]): string {
    return items.map(item => `- ${item}`).join('\n');
  }

  /** 有序列表 */
  static orderedList(items: string[]): string {
    return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
  }

  /** 表格（简单实现） */
  static table(headers: string[], rows: string[][]): string {
    const headerRow = `| ${headers.join(' | ')} |`;
    const separator = `| ${headers.map(() => '---').join(' | ')} |`;
    const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
    return `${headerRow}\n${separator}\n${dataRows}`;
  }
}


export class MarkdownTemplateRenderer {
  /** 正则：匹配 {{key}}（key 只允许字母、数字、下划线） */
  private static placeholderRegex = /{{\s*([A-Za-z0-9_]+)\s*}}/g;

  /**
   * 将模板里的占位符替换为 data 中对应的值，并使用
   * MarkdownBuilder.bold 将文字包装为 **粗体**（如果你想要别的样式，只需自行修改）。
   *
   * @param template 原始模板字符串
   * @param data     键值对象（所有键必须能在模板中找到）
   * @param options  可选：是否对占位符使用粗体（默认 true）
   */
  static render(
    template: string,
    data: Record<string, string | number | boolean>,
    options: { bold?: boolean } = { bold: true }
  ): string {
    const useBold = options.bold ?? true;

    // 替换过程
    const result = template.replace(this.placeholderRegex, (_, key: string) => {
      const raw = data[key];
      if (raw === undefined) {
        // 未提供的键直接保持原样，便于调试
        return `{{${key}}}`;
      }
      const str = String(raw);
      return useBold ? MarkdownBuilder.bold(str) : str;
    });

    return result;
  }

  /**
   * 【可选】把渲染好的 Markdown 再转换成 HTML（使用 marked）。
   *
   * @param markdown markdown 文本
   * @returns        对应的 HTML 字符串
   */
  static renderToHtml(markdown: string): string | Promise<string> {
    return marked.parse(markdown);
  }
}


