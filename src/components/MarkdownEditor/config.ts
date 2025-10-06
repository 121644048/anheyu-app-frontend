/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-14 13:56:16
 * @LastEditTime: 2025-09-30 16:56:09
 * @LastEditors: 安知鱼
 */
import { config } from "md-editor-v3";
import TabsPlugin from "./plugins/markdown-it-tabs-plugin";
import FoldingPlugin from "./plugins/markdown-it-folding-plugin";
import HiddenPlugin from "./plugins/markdown-it-hidden-plugin";
import InlineStylesPlugin from "./plugins/markdown-it-inline-styles-plugin";
import ButtonPlugin from "./plugins/markdown-it-button-plugin";
import LinkCardPlugin from "./plugins/markdown-it-link-card-plugin";

export function installMarkdownEditorExtensions() {
  console.log("🔧 Installing markdown editor extensions...");

  config({
    markdownItConfig(mdit) {
      console.log("⚙️ Configuring markdown-it with plugins...");

      try {
        mdit.use(TabsPlugin);
        console.log("✅ TabsPlugin registered");

        mdit.use(FoldingPlugin);
        console.log("✅ FoldingPlugin registered");

        mdit.use(HiddenPlugin);
        console.log("✅ HiddenPlugin registered");

        mdit.use(InlineStylesPlugin);
        console.log("✅ InlineStylesPlugin registered");

        mdit.use(ButtonPlugin);
        console.log("✅ ButtonPlugin registered");

        mdit.use(LinkCardPlugin);
        console.log("✅ LinkCardPlugin registered");

        console.log("🎉 All markdown plugins configured successfully!");
      } catch (error) {
        console.error("❌ Error configuring plugins:", error);
      }
    }
  });

  console.log("✅ Markdown editor extensions installed");
}
