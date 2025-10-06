import type MarkdownIt from "markdown-it";

export default function inlineStylesPlugin(md: MarkdownIt): void {
  // 通用的行内样式解析函数，支持颜色参数
  function createInlineRule(
    tagName: string,
    className: string,
    styleType: "underline" | "emphasis" | "wavy" | "delete" | "text" | "bg"
  ) {
    return function (state: any, silent: boolean): boolean {
      const start = state.pos;

      // 检查是否是 {tagName 开头
      if (
        state.src.charCodeAt(start) !== 0x7b /* { */ ||
        !state.src
          .slice(start + 1, start + 1 + tagName.length)
          .startsWith(tagName)
      ) {
        return false;
      }

      // 寻找结束标记
      const closeTag = `{/${tagName}}`;
      const endPos = state.src.indexOf(closeTag, start + tagName.length + 1);
      if (endPos === -1) {
        return false;
      }

      if (silent) {
        return true;
      }

      // 提取完整内容
      const fullContent = state.src.slice(start, endPos + closeTag.length);

      // 解析：{tag color=#xxx}content{/tag}
      const contentMatch = fullContent.match(
        new RegExp(`\\{${tagName}\\s*(.*?)\\}(.*?)\\{\\/${tagName}\\}`, "s")
      );
      if (!contentMatch) {
        return false;
      }

      const paramsStr = contentMatch[1];
      const content = contentMatch[2];

      // 解析 color 参数
      const colorMatch = paramsStr.match(/color=([^\s}]+)/);
      const color = colorMatch ? colorMatch[1] : "";

      // 渲染内容（支持嵌套的行内样式）
      const renderedContent = md.renderInline(content);

      // 根据样式类型生成对应的 style
      let styleAttr = "";
      if (color) {
        let styleValue = "";
        switch (styleType) {
          case "underline":
            styleValue = `text-decoration-color: ${color}`;
            break;
          case "emphasis":
            styleValue = `text-emphasis-color: ${color}; -webkit-text-emphasis-color: ${color}`;
            break;
          case "wavy":
            styleValue = `text-decoration-color: ${color}`;
            break;
          case "delete":
            styleValue = `text-decoration-color: ${color}`;
            break;
          case "text":
            styleValue = `color: ${color}`;
            break;
          case "bg":
            styleValue = `background-color: ${color}`;
            break;
        }
        styleAttr = ` style="${styleValue}"`;
      }

      const html = `<span class="${className}"${styleAttr}>${renderedContent}</span>`;

      const token = state.push("html_inline", "", 0);
      token.content = html;

      state.pos = endPos + closeTag.length;
      return true;
    };
  }

  // 1. 下划线
  md.inline.ruler.before(
    "emphasis",
    "underline",
    createInlineRule("u", "inline-underline", "underline")
  );

  // 2. 着重号
  md.inline.ruler.before(
    "emphasis",
    "emphasis_mark",
    createInlineRule("emp", "inline-emphasis-mark", "emphasis")
  );

  // 3. 波浪线
  md.inline.ruler.before(
    "emphasis",
    "wavy",
    createInlineRule("wavy", "inline-wavy", "wavy")
  );

  // 4. 删除线（自定义样式）
  md.inline.ruler.before(
    "emphasis",
    "delete",
    createInlineRule("del", "inline-delete", "delete")
  );

  // 5. 键盘样式
  md.inline.ruler.before(
    "emphasis",
    "keyboard",
    createInlineRule("kbd", "inline-kbd", "text")
  );

  // 6. 密码样式
  md.inline.ruler.before(
    "emphasis",
    "password",
    createInlineRule("psw", "inline-password", "bg")
  );

  console.log("Inline styles plugin registered successfully");
}
