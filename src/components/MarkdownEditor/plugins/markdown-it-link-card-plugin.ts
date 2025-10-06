/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-10-03 13:57:18
 * @LastEditTime: 2025-10-03 13:57:26
 * @LastEditors: 安知鱼
 */
import type MarkdownIt from "markdown-it";

export default function linkCardPlugin(md: MarkdownIt): void {
  function linkCardRule(state: any, silent: boolean): boolean {
    const start = state.pos;

    // 检查是否是 {linkcard 开头
    if (
      state.src.charCodeAt(start) !== 0x7b /* { */ ||
      !state.src.slice(start + 1, start + 9).startsWith("linkcard")
    ) {
      return false;
    }

    // 寻找结束标记 {/linkcard}
    const closeTag = "{/linkcard}";
    const endPos = state.src.indexOf(closeTag, start + 9);
    if (endPos === -1) {
      return false;
    }

    if (silent) {
      return true;
    }

    // 提取完整内容
    const fullContent = state.src.slice(start, endPos + closeTag.length);

    // 解析：{linkcard url=xxx title=xxx sitename=xxx icon=xxx tips=xxx}{/linkcard}
    const contentMatch = fullContent.match(
      /\{linkcard\s+(.*?)\}\{\/linkcard\}/s
    );
    if (!contentMatch) {
      return false;
    }

    const paramsStr = contentMatch[1];

    // 解析参数（支持带引号的值）
    const paramRegex = /(\w+)=(?:"([^"]*)"|(\S+))/g;
    const parsedParams: any = {};
    let match;
    while ((match = paramRegex.exec(paramsStr)) !== null) {
      parsedParams[match[1]] = match[2] || match[3];
    }

    // 获取参数值
    const url = parsedParams.url || "#";
    const title = parsedParams.title || "链接标题";
    const sitename = parsedParams.sitename || "网站名称";
    const icon = parsedParams.icon || "anzhiyu-icon-link";
    const tips = parsedParams.tips || "引用站外地址";

    // 生成链接卡片 HTML
    const html = `<div class="anzhiyu-tag-link"><a class="tag-Link" target="_blank" href="${md.utils.escapeHtml(url)}" rel="external nofollow noreferrer">
    <div class="tag-link-tips">${md.utils.escapeHtml(tips)}</div>
    <div class="tag-link-bottom">
        <div class="tag-link-left" style="">
          <i class="anzhiyufont ${md.utils.escapeHtml(icon)}"></i>
        </div>
        <div class="tag-link-right">
            <div class="tag-link-title">${md.utils.escapeHtml(title)}</div>
            <div class="tag-link-sitename">${md.utils.escapeHtml(sitename)}</div>
        </div>
        <i class="anzhiyufont anzhiyu-icon-angle-right"></i>
    </div>
    </a></div>`;

    const token = state.push("html_inline", "", 0);
    token.content = html;

    state.pos = endPos + closeTag.length;
    return true;
  }

  // 注册行内规则
  md.inline.ruler.before("emphasis", "linkcard", linkCardRule);

  console.log("LinkCard plugin registered successfully");
}
