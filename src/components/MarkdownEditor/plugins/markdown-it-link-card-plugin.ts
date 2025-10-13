/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-10-03 13:57:18
 * @LastEditTime: 2025-10-13 18:35:47
 * @LastEditors: 安知鱼
 */
import type MarkdownIt from "markdown-it";

// 解析参数的辅助函数
function parseParams(paramsStr: string): any {
  const parsedParams: any = {};
  const params = paramsStr.trim();
  let i = 0;

  while (i < params.length) {
    // 跳过空格
    while (i < params.length && params[i] === " ") i++;
    if (i >= params.length) break;

    // 解析参数名
    let paramName = "";
    while (i < params.length && params[i] !== "=") {
      paramName += params[i];
      i++;
    }

    if (i >= params.length || params[i] !== "=") break;
    i++; // 跳过 '='

    // 解析参数值
    let paramValue = "";
    if (i < params.length && params[i] === '"') {
      // 带引号的值
      i++; // 跳过开始引号
      while (i < params.length && params[i] !== '"') {
        paramValue += params[i];
        i++;
      }
      if (i < params.length) i++; // 跳过结束引号
    } else {
      // 不带引号的值，读取到下一个参数
      while (i < params.length) {
        // 检查是否遇到下一个参数
        if (params[i] === " ") {
          let j = i + 1;
          while (j < params.length && params[j] === " ") j++;
          if (j < params.length && /\w/.test(params[j])) {
            let k = j;
            while (k < params.length && /\w/.test(params[k])) k++;
            if (k < params.length && params[k] === "=") {
              break; // 找到下一个参数
            }
          }
        }
        paramValue += params[i];
        i++;
      }
      paramValue = paramValue.trim();
    }

    if (paramName.trim()) {
      parsedParams[paramName.trim()] = paramValue;
    }
  }

  return parsedParams;
}

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
      /\{linkcard\s*(.*?)\}\{\/linkcard\}/s
    );
    if (!contentMatch) {
      return false;
    }

    const paramsStr = contentMatch[1];
    const parsedParams = parseParams(paramsStr);

    // 获取参数值
    const url = parsedParams.url || "#";
    const title = parsedParams.title || "链接标题";
    const sitename = parsedParams.sitename || "网站名称";
    const icon = parsedParams.icon || "anzhiyu-icon-link";
    const tips = parsedParams.tips || "引用站外地址";

    // 判断图标是否为 HTTP 链接
    const isHttpIcon =
      icon.startsWith("http://") || icon.startsWith("https://");
    const iconHtml = isHttpIcon
      ? `<img src="${md.utils.escapeHtml(icon)}" alt="icon" style="width: 20px; height: 20px; object-fit: cover; border-radius: 4px; margin: 0; padding: 0; display: block;">`
      : `<i class="anzhiyufont ${md.utils.escapeHtml(icon)}"></i>`;

    // 生成链接卡片 HTML
    const html = `<div class="anzhiyu-tag-link"><a class="tag-Link" target="_blank" href="${md.utils.escapeHtml(url)}" rel="external nofollow noreferrer">
    <div class="tag-link-tips">${md.utils.escapeHtml(tips)}</div>
    <div class="tag-link-bottom">
        <div class="tag-link-left" style="">
          ${iconHtml}
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

  // 块级规则处理独立行的 linkcard
  function linkCardBlockRule(
    state: any,
    start: number,
    end: number,
    silent: boolean
  ): boolean {
    const pos = state.bMarks[start] + state.tShift[start];
    const max = state.eMarks[start];

    // 检查是否是独立行的 {linkcard
    if (pos >= max) return false;

    const line = state.src.slice(pos, max);
    if (!line.trim().startsWith("{linkcard")) return false;

    // 寻找结束行
    let nextLine = start;
    let foundEnd = false;

    for (nextLine = start; nextLine < end; nextLine++) {
      const linePos = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineMax = state.eMarks[nextLine];
      const currentLine = state.src.slice(linePos, lineMax);

      if (currentLine.includes("{/linkcard}")) {
        foundEnd = true;
        break;
      }
    }

    if (!foundEnd) return false;

    if (silent) return true;

    // 提取完整内容
    const startPos = state.bMarks[start] + state.tShift[start];
    const endPos = state.eMarks[nextLine];
    const fullContent = state.src.slice(startPos, endPos);

    // 使用相同的解析逻辑
    const contentMatch = fullContent.match(
      /\{linkcard\s*(.*?)\}\{\/linkcard\}/s
    );
    if (!contentMatch) return false;

    const paramsStr = contentMatch[1];
    const parsedParams = parseParams(paramsStr);

    const url = parsedParams.url || "#";
    const title = parsedParams.title || "链接标题";
    const sitename = parsedParams.sitename || "网站名称";
    const icon = parsedParams.icon || "anzhiyu-icon-link";
    const tips = parsedParams.tips || "引用站外地址";

    // 判断图标是否为 HTTP 链接
    const isHttpIcon =
      icon.startsWith("http://") || icon.startsWith("https://");
    const iconHtml = isHttpIcon
      ? `<img src="${md.utils.escapeHtml(
          icon
        )}" alt="icon" style="width: 20px; height: 20px; object-fit: cover; border-radius: 4px; margin: 0; padding: 0; display: block;">`
      : `<i class="anzhiyufont ${md.utils.escapeHtml(icon)}"></i>`;

    const html = `<div class="anzhiyu-tag-link"><a class="tag-Link" target="_blank" href="${md.utils.escapeHtml(
      url
    )}" rel="external nofollow noreferrer">
    <div class="tag-link-tips">${md.utils.escapeHtml(tips)}</div>
    <div class="tag-link-bottom">
        <div class="tag-link-left" style="">
          ${iconHtml}
        </div>
        <div class="tag-link-right">
            <div class="tag-link-title">${md.utils.escapeHtml(title)}</div>
            <div class="tag-link-sitename">${md.utils.escapeHtml(
              sitename
            )}</div>
        </div>
        <i class="anzhiyufont anzhiyu-icon-angle-right"></i>
    </div>
    </a></div>`;

    const token = state.push("html_block", "", 0);
    token.content = html;

    state.line = nextLine + 1;
    return true;
  }

  // 注册块级规则和行内规则
  md.block.ruler.before("paragraph", "linkcard_block", linkCardBlockRule);
  md.inline.ruler.before("text", "linkcard", linkCardRule);

  console.log("LinkCard plugin registered successfully");
}
