import type MarkdownIt from "markdown-it";

export default function customFoldingPlugin(md: MarkdownIt): void {
  function foldingBlockRule(
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const startMarker = ":::";
    const startTag = "folding";

    // 获取当前行的起始位置（考虑缩进）
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    // 如果行太短，无法包含标记，则跳过
    if (pos + startMarker.length > max) {
      return false;
    }

    // 检查是否是 ::: 开头
    if (
      state.src.charCodeAt(pos) !== 0x3a /* : */ ||
      state.src.charCodeAt(pos + 1) !== 0x3a /* : */ ||
      state.src.charCodeAt(pos + 2) !== 0x3a /* : */
    ) {
      return false;
    }

    // 检查 ::: 后面是否是 folding
    const params = state.src.slice(pos + startMarker.length, max).trim();
    if (!params.startsWith(startTag)) {
      return false;
    }

    // 记录起始行的缩进量
    const startIndent = state.tShift[startLine];

    // 寻找结束标记 :::
    let nextLine = startLine + 1;
    let endLineFound = false;
    while (nextLine < endLine) {
      // 如果遇到空行，继续
      if (state.isEmpty(nextLine)) {
        nextLine++;
        continue;
      }

      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      // 检查缩进是否一致或更小（表示退出当前块）
      if (state.tShift[nextLine] < startIndent) {
        // 缩进减少，可能退出了当前上下文
        break;
      }

      const lineText = state.src.slice(pos, max).trim();
      if (lineText === startMarker) {
        endLineFound = true;
        break;
      }
      nextLine++;
    }

    if (!endLineFound) {
      return false;
    }

    if (silent) {
      return true;
    }

    // --- 解析参数：提取 open 和颜色 ---
    const paramsParts = params.slice(startTag.length).trim().split(/\s+/);
    let isOpen = false;
    let color = "";

    paramsParts.forEach(part => {
      if (part === "open") {
        isOpen = true;
      } else if (part && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(part)) {
        // 只支持十六进制颜色值
        color = part;
      }
    });

    // --- 提取区块内容（处理缩进）---
    let content = "";
    for (let i = startLine + 1; i < nextLine; i++) {
      const lineStart = state.bMarks[i] + state.tShift[i];
      const lineEnd = state.eMarks[i];
      const lineContent = state.src.slice(lineStart, lineEnd);
      content += lineContent + "\n";
    }

    // 分离标题和内容
    // 第一行作为标题，其余作为内容
    const lines = content.split("\n");
    const title = lines[0]?.trim() || "折叠框";
    const bodyContent = lines.slice(1).join("\n").trim();

    // 渲染内容
    const renderedContent = md.render(bodyContent);

    // --- 生成 HTML ---
    const openAttr = isOpen ? ' open=""' : "";
    let customColorClass = "";
    let detailsStyle = "";
    let detailsEvents = "";
    let summaryStyle = "";
    let summaryEvents = "";

    if (color) {
      // 添加自定义颜色标记类，用于排除默认 CSS 样式
      customColorClass = " custom-color";
      // 只有展开状态时，summary 才有背景色
      if (isOpen) {
        summaryStyle = ` style="background-color: ${color};"`;
      }
      detailsStyle = ` style="border-color: ${color};"`;
      // 添加 toggle 事件处理器（处理点击展开/收起）
      // 展开时设置背景色，关闭时延迟检查 hover 状态
      detailsEvents = ` ontoggle="var s=this.querySelector('summary');if(this.open){s.style.backgroundColor='${color}'}else{setTimeout(function(){if(!s.matches(':hover')){s.style.backgroundColor=''}},10)}"`;
      // 添加 hover 事件处理器
      summaryEvents = ` onmouseover="this.style.backgroundColor='${color}'" onmouseout="if(!this.parentElement.open){this.style.backgroundColor=''}"`;
    }

    const finalHtml = `<details class="folding-tag${customColorClass}"${openAttr}${detailsStyle}${detailsEvents}>
  <summary${summaryStyle}${summaryEvents}> ${md.utils.escapeHtml(title)} </summary>
  <div class="content">
${renderedContent}
  </div>
</details>`;

    const token = state.push("html_block", "", 0);
    token.content = finalHtml;
    token.map = [startLine, nextLine + 1];
    token.markup = startMarker;

    state.line = nextLine + 1;
    return true;
  }

  // 注册规则 - 在 fence 之前注册
  md.block.ruler.before("fence", "folding", foldingBlockRule, {
    alt: ["paragraph", "reference", "blockquote", "list"]
  });

  // 添加调试信息
  console.log("Folding plugin registered successfully");
}
