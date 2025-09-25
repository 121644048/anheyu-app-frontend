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
    if (params !== startTag) {
      return false;
    }

    // 寻找结束标记 :::
    let nextLine = startLine + 1;
    let endLineFound = false;
    while (nextLine < endLine) {
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
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

    // --- 提取并解析区块内容 ---

    const content = state.src.slice(
      state.bMarks[startLine + 1],
      state.bMarks[nextLine]
    );

    const tabs: Tab[] = [];
    const lines = content.split("\n");
    let currentTab: Tab | null = null;
    const tabHeaderRegex = /^==\s+tab\s+(.*)/;

    for (const line of lines) {
      const match = line.trim().match(tabHeaderRegex);
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
      const isActive = index === 0;
      const tabId = `${tabsId}-${index + 1}`;

      navHtml += `<button type="button" class="tab${isActive ? " active" : ""}" data-href="${tabId}">${tab.caption}</button>`;

      const renderedContent = md.render(tab.content.trim());
      contentHtml += `<div class="tab-item-content${isActive ? " active" : ""}" id="${tabId}">${renderedContent}</div>`;
    });

    navHtml += "</ul>";
    contentHtml += "</div>";

    const finalHtml = `<div class="tabs" id="${tabsId}">${navHtml}${contentHtml}<div class="tab-to-top"><button type="button" aria-label="scroll to top"><i class="anzhiyufont anzhiyu-icon-arrow-up"></i></button></div></div>`;

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
