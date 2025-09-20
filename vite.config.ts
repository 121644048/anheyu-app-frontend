/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-09-17 14:00:01
 * @LastEditors: 安知鱼
 */
import { getPluginsList } from "./build/plugins";
import { include, exclude } from "./build/optimize";
import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import {
  root,
  alias,
  wrapperEnv,
  pathResolve,
  __APP_INFO__
} from "./build/utils";

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } =
    wrapperEnv(loadEnv(mode, root));
  return {
    base: VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias
    },
    // 服务端渲染
    server: {
      // 端口号
      port: VITE_PORT,
      host: "0.0.0.0",
      // 本地跨域代理 https://cn.vitejs.dev/config/server-options.html#server-proxy
      proxy: {
        "/api": {
          target: "http://localhost:8091",
          changeOrigin: true
        },
        "/f/": {
          target: "http://localhost:8091",
          changeOrigin: true
        },
        "/needcache/": {
          target: "http://localhost:8091",
          changeOrigin: true
        }
      },
      // 首屏优化：预热关键文件，优化初始页面加载
      warmup: {
        clientFiles: [
          "./index.html",
          "./src/main.ts",
          "./src/App.vue",
          "./src/router/index.ts",
          "./src/store/modules/user.ts",
          "./src/layout/index.vue",
          "./src/views/login/index.vue",
          // 预热首屏关键组件
          "./src/views/post/post-home/index.vue",
          "./src/layout/frontend/index.vue"
        ]
      }
    },
    plugins: getPluginsList(VITE_CDN, VITE_COMPRESSION),
    // https://cn.vitejs.dev/config/dep-optimization-options.html#dep-optimization-options
    optimizeDeps: {
      include,
      exclude
    },
    build: {
      // https://cn.vitejs.dev/guide/build.html#browser-compatibility
      target: "es2015",
      sourcemap: false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
      rollupOptions: {
        input: {
          index: pathResolve("./index.html", import.meta.url)
        },
        // 静态资源分类打包
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
          // 首屏优化：更精细的代码分割策略
          manualChunks(id) {
            // 1. Vue核心库 - 首屏必需
            if (
              id.includes("vue") &&
              (id.includes("node_modules/vue/") ||
                id.includes("node_modules/vue-router/") ||
                id.includes("node_modules/pinia/"))
            ) {
              return "vue-vendor";
            }

            // 2. Element Plus - 首屏必需的UI组件
            if (id.includes("node_modules/element-plus/")) {
              return "element-plus";
            }

            // 3. 核心工具库 - 首屏必需
            if (
              id.includes("@pureadmin/utils") ||
              id.includes("dayjs") ||
              id.includes("axios") ||
              id.includes("responsive-storage")
            ) {
              return "utils";
            }

            // 4. Monaco编辑器 - 动态导入时才加载，单独分包避免影响首屏
            if (id.includes("monaco-editor")) {
              return "monaco-editor";
            }

            // 5. Markdown编辑器 - 懒加载
            if (id.includes("md-editor-v3") || id.includes("katex")) {
              return "markdown-editor";
            }

            // 6. 媒体库 - 懒加载
            if (
              id.includes("xgplayer") ||
              id.includes("cropperjs") ||
              id.includes("@fancyapps/ui")
            ) {
              return "media-libs";
            }

            // 7. 动画和交互库 - 按需加载
            if (
              id.includes("gsap") ||
              id.includes("animate.css") ||
              id.includes("@vueuse/motion")
            ) {
              return "animation-libs";
            }

            // 8. 图标库 - 按需加载
            if (id.includes("@iconify") || id.includes("iconify")) {
              return "icon-libs";
            }

            // 9. 其他第三方库 - 懒加载
            if (
              id.includes("node_modules") &&
              !id.includes("vue") &&
              !id.includes("element-plus")
            ) {
              return "vendor-libs";
            }
          }
        }
      }
    },
    define: {
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_INFO__: JSON.stringify(__APP_INFO__)
    }
  };
};
