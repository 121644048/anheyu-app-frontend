/*
 * @Description: 文本预览组件 - 优化版本，延迟加载 Monaco Editor
 * @Author: 安知鱼
 * @Date: 2025-09-22 09:54:00
 * @LastEditTime: 2025-09-22 09:54:00
 * @LastEditors: 安知鱼
 */

import { defineAsyncComponent } from "vue";

// 使用 defineAsyncComponent 延迟加载组件
// 这样 Monaco Editor 只有在真正需要文本预览时才会加载
export default defineAsyncComponent({
  loader: () => import("./src/index.vue"),
  // 加载中的组件
  loadingComponent: {
    template: `
      <div class="text-preview-loading" style="
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
      ">
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: white;
        ">
          <div style="
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <span>编辑器加载中...</span>
        </div>
      </div>
    `
  },
  // 错误组件
  errorComponent: {
    template: `
      <div class="text-preview-error" style="
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
      ">
        <div style="
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          text-align: center;
        ">
          <h3 style="margin: 0 0 10px 0; color: #e74c3c;">加载失败</h3>
          <p style="margin: 0; color: #7f8c8d;">编辑器组件加载失败，请刷新页面重试</p>
        </div>
      </div>
    `
  },
  // 延迟 200ms 加载，避免闪烁
  delay: 200,
  // 超时 10 秒
  timeout: 10000
});
