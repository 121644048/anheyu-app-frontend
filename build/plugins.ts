/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-11 11:59:32
 * @LastEditTime: 2025-09-29 15:32:03
 * @LastEditors: 安知鱼
 */
import { cdn } from "./cdn";
import vue from "@vitejs/plugin-vue";
import { viteBuildInfo } from "./info";
import svgLoader from "vite-svg-loader";
import type { PluginOption } from "vite";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { configCompressPlugin } from "./compress";
import removeNoMatch from "vite-plugin-router-warn";
import { visualizer } from "rollup-plugin-visualizer";
import removeConsole from "vite-plugin-remove-console";
import { promises as fs } from "node:fs";
import { resolve } from "node:path";

export function getPluginsList(
  VITE_CDN: boolean,
  VITE_COMPRESSION: ViteCompression
): PluginOption[] {
  const lifecycle = process.env.npm_lifecycle_event;
  return [
    vue(),
    vueJsx(),
    viteBuildInfo(),
    removeNoMatch(),
    svgLoader(),
    VITE_CDN ? cdn : null,
    configCompressPlugin(VITE_COMPRESSION),
    removeConsole({
      external: [
        "src/assets/iconfont/iconfont.js",
        "src/utils/consolePrinter.ts"
      ]
    }),
    // 关于 `(null as any)`: 这是一个类型断言，用于告诉 TypeScript 在条件为假时，一个 null 值可以被接受为 PluginOption 类型。这在条件化插件的场景下是常见且合理的用法。
    lifecycle === "report"
      ? visualizer({ open: true, brotliSize: true, filename: "report.html" })
      : (null as any),

    // 自定义插件 - 异步加载 CSS
    {
      name: "load-stylesheet-async",
      transformIndexHtml(html) {
        return html.replace(
          /<link rel="stylesheet" crossorigin href="(.+?)">/g,
          `<link rel="stylesheet" crossorigin href="$1" media="print" onload="this.media='all'">`
        );
      }
    },

    // 自定义插件 - 生成版本信息文件
    {
      name: "generate-version",
      async writeBundle(outputOptions) {
        const version = {
          name: process.env.npm_package_name,
          version: process.env.npm_package_version
        };
        // Rollup 的 `outputOptions.dir` 钩子会提供输出目录的绝对路径
        const path = resolve(outputOptions.dir, "version.json");
        // 4. 使用导入的 'fs' (fs.promises) 来异步写入文件
        await fs.writeFile(path, JSON.stringify(version, null, 2));
      }
    }
  ];
}
