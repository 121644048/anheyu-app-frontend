/*
 * @Description: 主入口文件
 * @Author: 安知鱼
 * @Date: 2025-06-11 11:59:32
 * @LastEditTime: 2025-09-22 12:50:44
 * @LastEditors: 安知鱼
 */

// 卸载 Service Worker 和清理 PWA 缓存
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      console.log("🗑️ 卸载 Service Worker:", registration.scope);
      registration.unregister();
    });
  });

  if ("caches" in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        console.log("🗑️ 清除缓存:", cacheName);
        caches.delete(cacheName);
      });
    });
  }
}

import App from "./App.vue";
import router from "./router";
import { setupStore } from "@/store";
import { initializeConfigs } from "./config";
import { MotionPlugin } from "@vueuse/motion";
import { createApp, type Directive } from "vue";
import { useElementPlus } from "@/plugins/elementPlus";
import { injectResponsiveStorage } from "@/utils/responsive";

import Table from "@pureadmin/table";
// 引入重置样式
import "./style/reset.scss";
// 导入公共样式
import "./style/index.scss";
// 导入关于页面样式
import "./views/post/about/styles/about.scss";
// 一定要在main.ts中导入tailwind.css，防止vite每次hmr都会请求src/style/index.scss整体css文件导致热更新慢的问题
import "./style/tailwind.css";
// 导入字体图标
import "./assets/iconfont-anzhiyu/ali_iconfont_css.css";

const app = createApp(App);

// 自定义指令
import * as directives from "@/directives";
Object.keys(directives).forEach(key => {
  app.directive(key, (directives as { [key: string]: Directive })[key]);
});

// 全局注册@iconify/vue图标库
import {
  IconifyIconOffline,
  IconifyIconOnline,
  FontIcon
} from "./components/ReIcon";
app.component("IconifyIconOffline", IconifyIconOffline);
app.component("IconifyIconOnline", IconifyIconOnline);
app.component("FontIcon", FontIcon);

// 全局注册按钮级别权限组件
import { Auth } from "@/components/ReAuth";
import { Perms } from "@/components/RePerms";
app.component("Auth", Auth);
app.component("Perms", Perms);

// 全局注册vue-tippy
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import VueTippy from "vue-tippy";
app.use(VueTippy);

// 确保 Pinia 在任何 Store 被使用之前就被安装到 Vue 应用中
setupStore(app);

initializeConfigs(app)
  .then(async () => {
    app.use(router);
    await router.isReady();
    // 确保平台配置已成功加载
    const platformConfig = app.config.globalProperties
      .$config as PlatformConfigs;
    if (!platformConfig) {
      console.error("Platform config is not available.");
      throw new Error("平台配置未成功加载。");
    }
    injectResponsiveStorage(app, platformConfig);

    app.use(MotionPlugin).use(useElementPlus).use(Table);
    app.mount("#app");
  })
  .catch(error => {
    console.error("应用程序初始化失败:", error);
  });
