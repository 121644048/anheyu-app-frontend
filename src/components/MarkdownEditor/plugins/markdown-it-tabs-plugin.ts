import type MarkdownIt from "markdown-it";

// 为了代码清晰，定义一个 Tab 接口
interface Tab {
  caption: string;
  content: string;
}

export default function customTabsPlugin(md: MarkdownIt): void {
  function tabsBlockRule(
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const startMarker = ":::";
    const startTag = "tabs";
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

    // 检查 ::: 后面是否是 tabs
    const params = state.src.slice(pos + startMarker.length, max).trim();
    if (!params.startsWith(startTag)) {
      return false;
    }

    // 解析参数，获取默认激活的 tab（active=数字）
    let activeIndex = 0; // 默认第一个
    const activeMatch = params.match(/active=(\d+)/);
    if (activeMatch) {
      activeIndex = parseInt(activeMatch[1], 10) - 1; // 转换为 0-based 索引
    }

    // 寻找结束标记 :::，支持嵌套，并跳过代码块
    let nextLine = startLine + 1;
    let endLineFound = false;
    let nestedLevel = 0; // 嵌套层级计数
    let inCodeBlock = false; // 是否在代码块内
    let codeBlockMarker = ""; // 代码块标记（``` 或 ~~~）

    while (nextLine < endLine) {
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      const lineText = state.src.slice(pos, max).trim();

      // 检查是否是代码块标记（``` 或 ~~~，可能带语言标识符）
      const codeBlockMatch = lineText.match(/^(`{3,}|~{3,})/);
      if (codeBlockMatch) {
        const marker = codeBlockMatch[1];
        if (!inCodeBlock) {
          // 进入代码块
          inCodeBlock = true;
          codeBlockMarker = marker;
        } else if (
          lineText.startsWith(codeBlockMarker) &&
          lineText.trim() === codeBlockMarker
        ) {
          // 退出代码块（必须是纯标记，不带语言标识符）
          inCodeBlock = false;
          codeBlockMarker = "";
        }
      }

      // 只在非代码块内检查 ::: 标记
      if (!inCodeBlock && lineText.startsWith(startMarker)) {
        if (lineText.length > startMarker.length) {
          // 是 :::xxx 这样的开始标记，增加嵌套层级
          nestedLevel++;
        } else if (lineText === startMarker) {
          // 是纯 ::: 结束标记
          if (nestedLevel === 0) {
            // 当前层级，找到结束标记
            endLineFound = true;
            break;
          } else {
            // 嵌套块的结束标记，减少层级
            nestedLevel--;
          }
        }
      }
      nextLine++;
    }

    if (!endLineFound) {
      return false;
    }

    if (silent) {
      return true;
    }

    // --- 提取并解析区块内容 ---

    const content = state.src.slice(
      state.bMarks[startLine + 1],
      state.bMarks[nextLine]
    );

    const tabs: Tab[] = [];
    const lines = content.split("\n");
    let currentTab: Tab | null = null;
    const tabHeaderRegex = /^==\s+tab\s+(.*)/;
    let inTabCodeBlock = false;
    let tabCodeBlockMarker = "";

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 检查是否是代码块标记
      const codeBlockMatch = trimmedLine.match(/^(`{3,}|~{3,})/);
      if (codeBlockMatch) {
        const marker = codeBlockMatch[1];
        if (!inTabCodeBlock) {
          inTabCodeBlock = true;
          tabCodeBlockMarker = marker;
        } else if (
          trimmedLine.startsWith(tabCodeBlockMarker) &&
          trimmedLine === tabCodeBlockMarker
        ) {
          inTabCodeBlock = false;
          tabCodeBlockMarker = "";
        }
      }

      // 只在非代码块内识别 tab 标题
      const match = !inTabCodeBlock ? trimmedLine.match(tabHeaderRegex) : null;
      if (match) {
        // 匹配到新的 tab 标题行
        if (currentTab) {
          tabs.push(currentTab); // 保存上一个 tab
        }
        currentTab = {
          caption: match[1].trim(),
          content: ""
        };
      } else if (currentTab) {
        // 属于当前 tab 的内容行
        currentTab.content += line + "\n";
      }
    }
    // 保存最后一个 tab
    if (currentTab) {
      tabs.push(currentTab);
    }

    // 如果容器内没有找到任何 tab，则直接渲染内容
    if (tabs.length === 0) {
      const token = state.push("html_block", "", 0);
      token.content = `<div class="tabs-container">${md.render(content)}</div>`;
      token.map = [startLine, nextLine + 1];
      state.line = nextLine + 1;
      return true;
    }

    // --- 生成 HTML ---
    // 使用 state.env 来确保同一页面上多个 tabs 容器的 ID 是唯一的
    if (!state.env.tabsCount) {
      state.env.tabsCount = 0;
    }
    state.env.tabsCount++;
    const tabsId = `tabs-container-${state.env.tabsCount}`;

    let navHtml = `<ul class="nav-tabs">`;
    let contentHtml = '<div class="tab-contents">';

    tabs.forEach((tab, index) => {
      const isActive = index === activeIndex;
      const tabId = `${tabsId}-${index + 1}`;

      // 内置 Tab 切换逻辑
      const tabClickHandler = `
        event.preventDefault();
        if(this.classList.contains('active')) return;
        const container = this.closest('.tabs');
        container.querySelectorAll('.nav-tabs .tab').forEach(btn => btn.classList.remove('active'));
        container.querySelectorAll('.tab-item-content').forEach(content => content.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('${tabId}').classList.add('active');
      `
        .replace(/\s+/g, " ")
        .trim();

      navHtml += `<button type="button" class="tab${isActive ? " active" : ""}" data-href="${tabId}" onclick="${tabClickHandler}">${tab.caption}</button>`;

      const renderedContent = md.render(tab.content.trim());
      contentHtml += `<div class="tab-item-content${isActive ? " active" : ""}" id="${tabId}">${renderedContent}</div>`;
    });

    navHtml += "</ul>";
    contentHtml += "</div>";

    // 内置滚动到顶部逻辑
    const scrollToTopHandler = `
      event.preventDefault();
      this.closest('.tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
    `
      .replace(/\s+/g, " ")
      .trim();

    const finalHtml = `<div class="tabs" id="${tabsId}">${navHtml}${contentHtml}<div class="tab-to-top"><button type="button" aria-label="scroll to top" onclick="${scrollToTopHandler}"><i class="anzhiyufont anzhiyu-icon-arrow-up"></i></button></div></div>`;

    const token = state.push("html_block", "", 0);
    token.content = finalHtml;
    token.map = [startLine, nextLine + 1];
    token.markup = startMarker;

    state.line = nextLine + 1;
    return true;
  }

  // 注册我们的规则
  md.block.ruler.before("fence", "tabs", tabsBlockRule);

  // 添加调试信息
  console.log("Tabs plugin registered successfully");
}
