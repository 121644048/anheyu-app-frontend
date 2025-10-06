<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-10 11:28:27
 * @LastEditTime: 2025-09-30 10:44:39
 * @LastEditors: 安知鱼
-->
<template>
  <view />
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { ElNotification } from "element-plus";
import { onPWAUpdated } from "@/utils/versionManager";

// 🔧 PWA状态检查：开发环境禁用，生产环境保守策略
onMounted(() => {
  if (import.meta.env.DEV) {
    console.log("🔍 开发环境：PWA已禁用，避免干扰登录流程");
  } else {
    // 生产环境：检查Service Worker是否可用
    if ("serviceWorker" in navigator) {
      console.log("🔍 生产环境：PWA可用，采用保守更新策略");

      // 监听Service Worker的状态变化
      navigator.serviceWorker.addEventListener("controllerchange", async () => {
        console.log("🔄 Service Worker已更新，正在刷新版本信息...");

        // PWA 更新时刷新版本缓存
        await onPWAUpdated();

        // 显示温和的更新提示，不强制刷新
        ElNotification({
          title: "应用已更新",
          message: "应用已更新到最新版本，可离线使用。",
          type: "success",
          duration: 3000
        });
      });
    } else {
      console.log("📱 当前浏览器不支持Service Worker");
    }
  }
});
</script>
