/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-11 11:59:32
 * @LastEditTime: 2025-08-31 23:05:31
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
// import { codeInspectorPlugin } from "code-inspector-plugin";
import { VitePWA } from "vite-plugin-pwa";
// import monacoEditorPlugin from "vite-plugin-monaco-editor"; // 移除Monaco Editor插件，改用动态导入

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
    // codeInspectorPlugin({
    //   bundler: "vite",
    //   hideConsole: true
    // }),
    viteBuildInfo(),
    removeNoMatch(),
    // vitePluginFakeServer({ ... }),
    svgLoader(),
    VITE_CDN ? cdn : null,
    configCompressPlugin(VITE_COMPRESSION),
    removeConsole({ external: ["src/assets/iconfont/iconfont.js"] }),
    // 关于 `(null as any)`: 这是一个类型断言，用于告诉 TypeScript 在条件为假时，一个 null 值可以被接受为 PluginOption 类型。这在条件化插件的场景下是常见且合理的用法。
    lifecycle === "report"
      ? visualizer({ open: true, brotliSize: true, filename: "report.html" })
      : (null as any),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      manifest: false,
      workbox: {
        maximumFileSizeToCacheInBytes: 10000000,
        navigateFallbackDenylist: [
          /^\/api\/(.+)/,
          /^\/f\/(.+)/,
          /^\/login/,
          /^\/admin/
        ],
        // 首屏优化：大幅减少预缓存文件数量，只缓存核心资源
        globPatterns: [
          // 只预缓存关键的入口文件和核心资源
          "static/js/vendor-libs-*.js", // Vue核心库和基础依赖
          "static/js/element-plus-*.js", // UI组件库
          "static/js/utils-*.js", // 工具库
          "static/css/index-*.css", // 主样式文件
          "static/css/element-plus-*.css", // Element Plus样式
          "favicon.ico",
          "logo.svg",
          "static/img/logo*.*" // Logo文件
        ],
        globIgnores: [
          // 只排除特定的大文件，让其他文件通过 globPatterns 精确控制
          "**/monacoeditorwork/*.js", // Monaco编辑器worker文件
          "**/static/js/monaco-editor-*.js", // Monaco编辑器主文件
          "**/static/js/markdown-*.js", // Markdown编辑器
          "**/static/js/media-*.js", // 媒体库
          "**/static/js/editor.main-*.js", // 代码编辑器主文件
          "**/static/js/SearchModal-*.js", // 搜索模态框
          "**/static/ttf/**", // 字体文件走运行时缓存
          "**/static/woff/**", // 字体文件走运行时缓存
          "**/static/woff2/**", // 字体文件走运行时缓存
          "**/static/eot/**", // 字体文件走运行时缓存
          "index.html" // HTML文件由服务器处理
        ],
        // 禁用导航回退，避免登录页面缓存问题
        navigateFallback: null,
        skipWaiting: false, // 防止自动刷新
        clientsClaim: false, // 防止立即激活新SW
        runtimeCaching: [
          {
            // 1. 页面导航缓存（排除登录和管理页面）
            urlPattern: ({ request, url }) => {
              return (
                request.mode === "navigate" &&
                !url.pathname.startsWith("/login") &&
                !url.pathname.startsWith("/admin")
              );
            },
            handler: "NetworkFirst",
            options: {
              cacheName: "anheyu-pages-cache",
              networkTimeoutSeconds: 2,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 缓存1天
              }
            }
          },
          {
            // 2. 动态导入的JS模块 - CacheFirst策略
            urlPattern: /\/static\/js\/.*\.js$/,
            handler: "CacheFirst",
            options: {
              cacheName: "anheyu-js-cache",
              expiration: {
                maxEntries: 100, // 允许更多JS文件缓存
                maxAgeSeconds: 60 * 60 * 24 * 7 // 缓存7天
              }
            }
          },
          {
            // 3. 样式文件 - CacheFirst策略
            urlPattern: /\/static\/css\/.*\.css$/,
            handler: "CacheFirst",
            options: {
              cacheName: "anheyu-css-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 缓存7天
              }
            }
          },
          {
            // 4. 字体文件 - CacheFirst策略（字体文件很少变动）
            urlPattern:
              /\/static\/(woff|woff2|ttf|eot)\/.*\.(woff|woff2|ttf|eot)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "anheyu-fonts-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 缓存30天
              }
            }
          },
          {
            // 5. API请求 - NetworkFirst策略
            urlPattern: /^\/api\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "anheyu-api-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // API缓存5分钟
              }
            }
          },
          {
            // 匹配 /static/img/ 目录下的所有图片文件
            urlPattern:
              /\/static\/img\/.*\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            // 使用 CacheFirst 策略
            // 1. 请求来了，先去缓存里找。
            // 2. 如果缓存里有，直接从缓存返回（速度极快）。
            // 3. 如果缓存里没有，就去请求网络，拿到响应后，存入缓存并返回给浏览器。
            // 这个策略非常适合不经常变化的静态资源，如图标、背景图等。
            handler: "CacheFirst",
            options: {
              // 为这个缓存策略创建一个专门的缓存空间
              cacheName: "anheyu-image-cache",
              // 配置插件，用于管理缓存的有效期和数量
              expiration: {
                // 最多缓存 100 张图片
                maxEntries: 100,
                // 缓存 30 天
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true // 抑制开发环境警告
      },
      // 稳定的文件缓存策略
      includeAssets: ["favicon.ico", "logo.svg", "static/img/**/*"]
    }),

    // Monaco Editor 已改为完全动态导入，不再需要插件预构建
    // 在需要使用Monaco Editor的组件中通过 import("monaco-editor") 动态加载

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
