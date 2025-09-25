/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-14 13:56:16
 * @LastEditTime: 2025-09-22 20:07:49
 * @LastEditors: 安知鱼
 */
import { config } from "md-editor-v3";
import TabsPlugin from "./plugins/markdown-it-tabs-plugin";

export function installMarkdownEditorExtensions() {
  console.log("🔧 Installing markdown editor extensions...");

  config({
    markdownItConfig(mdit) {
      console.log("⚙️ Configuring markdown-it with plugins...");

      try {
        mdit.use(TabsPlugin);
        console.log("✅ TabsPlugin registered");

        console.log("🎉 All markdown plugins configured successfully!");
      } catch (error) {
        console.error("❌ Error configuring plugins:", error);
      }
    }
  });

  console.log("✅ Markdown editor extensions installed");
}
